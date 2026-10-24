"use server";

import { auth } from "@clerk/nextjs/server";

import db from "@/lib/db";

import {
  getRoleFromSessionClaims,
} from "@/lib/auth/session";

const PHARMACY_ROLES = [
  "SuperAdmin",
  "admin",
  "Pharmacist",
];

async function requirePharmacyAccess() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const role = getRoleFromSessionClaims(
    sessionClaims
  );

  if (!role || !PHARMACY_ROLES.includes(role)) {
    throw new Error("You do not have pharmacy access");
  }

  return {
    userId,
    role,
  };
}


export async function getPharmacyPrescriptionsAction() {
  try {
    await requirePharmacyAccess();

    const prescriptions =
      await db.prescription.findMany({
        where: {
          status: {
            in: [
              "PENDING",
              "PARTIALLY_DISPENSED",
              "DISPENSED",
            ],
          },
        },

        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              first_name: true,
              last_name: true,
            },
          },

          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
            },
          },

          medicines: {
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  generic_name: true,
                  unit: true,
                },
              },
            },
          },
        },

        orderBy: {
          created_at: "desc",
        },
      });

    return {
      success: true,
      data: prescriptions.map((item) => ({
        ...item,
        created_at: item.created_at.toISOString(),
      })),
    };
  } catch (error) {
    console.error(
      "getPharmacyPrescriptionsAction:",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load prescriptions",
      data: [],
    };
  }
}


export async function getPrescriptionForDispensingAction(
  prescriptionId: string
) {
  try {
    await requirePharmacyAccess();

    const prescription =
      await db.prescription.findUnique({
        where: {
          id: prescriptionId,
        },

        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              first_name: true,
              last_name: true,
              phone: true,
              email: true,
              gender: true,
            },
          },

          doctor: {
            select: {
              id: true,
              name: true,
              specialization: true,
              license_number: true,
            },
          },

          medicines: {
            include: {
              medicine: {
                include: {
                  batches: {
                    where: {
                      quantity: {
                        gt: 0,
                      },

                      expiry_date: {
                        gt: new Date(),
                      },
                    },

                    orderBy: {
                      expiry_date: "asc",
                    },

                    select: {
                      id: true,
                      batch_number: true,
                      expiry_date: true,
                      quantity: true,
                      purchase_price: true,
                      selling_price: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!prescription) {
      return {
        success: false,
        message: "Prescription not found",
        data: null,
      };
    }

    return {
      success: true,

      data: {
        ...prescription,

        created_at:
          prescription.created_at.toISOString(),

        medicines: prescription.medicines.map(
          (item) => ({
            ...item,

            medicine: {
              ...item.medicine,

              batches:
                item.medicine.batches.map(
                  (batch) => ({
                    ...batch,

                    expiry_date:
                      batch.expiry_date.toISOString(),
                  })
                ),
            },
          })
        ),
      },
    };
  } catch (error) {
    console.error(
      "getPrescriptionForDispensingAction:",
      error
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load prescription",
      data: null,
    };
  }
}



export async function dispensePrescriptionAction(
  prescriptionId: string
) {
  try {
    const { userId } =
      await requirePharmacyAccess();

    const result = await db.$transaction(
      async (tx) => {
        const prescription =
          await tx.prescription.findUnique({
            where: {
              id: prescriptionId,
            },

            include: {
              medicines: {
                include: {
                  medicine: {
                    include: {
                      batches: {
                        where: {
                          quantity: {
                            gt: 0,
                          },

                          expiry_date: {
                            gt: new Date(),
                          },
                        },

                        orderBy: {
                          expiry_date: "asc",
                        },
                      },
                    },
                  },
                },
              },
            },
          });

        if (!prescription) {
          throw new Error(
            "Prescription not found"
          );
        }

        if (
          prescription.status === "CANCELLED"
        ) {
          throw new Error(
            "Cancelled prescriptions cannot be dispensed"
          );
        }

        if (
          prescription.status === "DISPENSED"
        ) {
          throw new Error(
            "Prescription is already fully dispensed"
          );
        }
        for (const item of prescription.medicines) {
          const remaining =
            item.quantity - item.dispensed_qty;

          if (remaining <= 0) {
            continue;
          }

          const available =
            item.medicine.batches.reduce(
              (sum, batch) =>
                sum + batch.quantity,
              0
            );

          if (available < remaining) {
            throw new Error(
              `Insufficient stock for ${item.medicine.name}. Required ${remaining}, available ${available}.`
            );
          }
        }

       
        for (const item of prescription.medicines) {
          const remaining =
            item.quantity - item.dispensed_qty;

          if (remaining <= 0) {
            continue;
          }

          let quantityLeft = remaining;

          for (const batch of item.medicine.batches) {
            if (quantityLeft <= 0) {
              break;
            }

            const dispenseQuantity =
              Math.min(
                batch.quantity,
                quantityLeft
              );

            if (dispenseQuantity <= 0) {
              continue;
            }

           
            const updated =
              await tx.medicineBatch.updateMany({
                where: {
                  id: batch.id,

                  quantity: {
                    gte: dispenseQuantity,
                  },
                },

                data: {
                  quantity: {
                    decrement:
                      dispenseQuantity,
                  },
                },
              });

            if (updated.count !== 1) {
              throw new Error(
                `Stock changed while dispensing ${item.medicine.name}. Please try again.`
              );
            }

           
     await tx.stockTransaction.create({
  data: {
    medicine_id: item.medicine_id,
    batch_id: batch.id,
    type: "DISPENSE",
    quantity: dispenseQuantity,
    unit_price: batch.selling_price,
    reason: `Prescription ${prescription.id}`,
    created_by: userId,
  },
});

            quantityLeft -=
              dispenseQuantity;
          }

         
          await tx.prescriptionMedicine.update({
            where: {
              id: item.id,
            },

            data: {
              dispensed_qty: {
                increment: remaining,
              },
            },
          });
        }


        const updatedItems =
          await tx.prescriptionMedicine.findMany({
            where: {
              prescription_id:
                prescription.id,
            },

            select: {
              quantity: true,
              dispensed_qty: true,
            },
          });

        const fullyDispensed =
          updatedItems.every(
            (item) =>
              item.dispensed_qty >=
              item.quantity
          );

        const partiallyDispensed =
          updatedItems.some(
            (item) =>
              item.dispensed_qty > 0
          );

        let newStatus:
          | "PENDING"
          | "PARTIALLY_DISPENSED"
          | "DISPENSED";

        if (fullyDispensed) {
          newStatus = "DISPENSED";
        } else if (partiallyDispensed) {
          newStatus =
            "PARTIALLY_DISPENSED";
        } else {
          newStatus = "PENDING";
        }

        await tx.prescription.update({
          where: {
            id: prescription.id,
          },

          data: {
            status: newStatus,
          },
        });

        return {
          status: newStatus,
        };
      }
    );

    return {
      success: true,

      message:
        result.status === "DISPENSED"
          ? "Prescription fully dispensed successfully."
          : "Prescription dispensed successfully.",

      status: result.status,
    };
  } catch (error) {
    console.error(
      "dispensePrescriptionAction:",
      error
    );

    return {
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Failed to dispense prescription",
    };
  }
}