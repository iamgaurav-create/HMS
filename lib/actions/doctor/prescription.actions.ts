"use server";

import { getRoleFromSessionClaims } from "@/lib/auth";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

type MedicineInput ={
    medicine_id: string;
    dosage:string;
    frequency: string;
    duration: string;
    quantity: number;
};

type CreatePrescriptionInput ={
    patient_id: string;
    medical_id?:number | null;
    notes?:string;
    medicines:MedicineInput[];
};

async function requireDoctor(){
    const{userId, sessionClaims} = await auth();
    if(!userId){
        throw new Error("Unauthorized");
    }
    const role= getRoleFromSessionClaims(sessionClaims);

    if(role!=="Doctor" && role!=="SuperAdmin" && role!=="admin"){
        throw new Error("Only authorized medical staff can manage prescriptions");
    }

    let doctor = await db.doctor.findFirst({
        where:{
            OR:[
                {
                    clerkUserId:userId,
                },
                {
                    id:userId,
                },
            ],
        },
    });

    if(!doctor && (role === "SuperAdmin" || role === "admin")){
        doctor = await db.doctor.findFirst({
            where: { status: "Active" },
        });
    }

    if(!doctor){
        throw new Error("Doctor Profile not Found. Please register a doctor profile first.");
    }
    return doctor;
}


export async  function getPrescriptionPatientsAction(){
    await requireDoctor();
      const patients = await db.patient.findMany({
    where: {
      status: "Active",
    },
    select: {
      id: true,
      patientNumber: true,
      first_name: true,
      last_name: true,
      date_of_birth: true,
      gender: true,
    },
    orderBy: {
      first_name: "asc",
    },
  });

  return patients;
}




export async function getPrescriptionMedicineAction(){
    await requireDoctor();
    const medicine = await db.medicine.findMany({
        where:{
            is_active: true,
        },
        select:{
            id: true,
            name: true,
            generic_name: true,
            unit: true,
            category: true,
        },
        orderBy:{
            name: "asc",
        },
    });
    return medicine;
}


export async function createPrescriptionAction(input: CreatePrescriptionInput){
    const doctor = await requireDoctor();
    const patientId = input.patient_id?.trim();

    if(!patientId){
        throw new Error("Please Select a Patient");
    }

    if(!input.medicines || input.medicines.length===0){
        throw new Error("Please Add at least one medicine");
    }

    const medicines = input.medicines.filter(
        (medicine)=>medicine.medicine_id
    );
    if(medicines.length === 0){
        throw new Error("Please add atleast one medicine");
    }

    const medicineIds = medicines.map((m) => m.medicine_id);
    const uniqueMedicineIds = new Set(medicineIds);
    if(uniqueMedicineIds.size !== medicineIds.length){
        throw new Error("The same medicine cannot be add more then once")
    };

    const patient = await db.patient.findFirst({
    where: {
      id: patientId,
      status: "Active",
    },
  });
  if(!patient){
    throw new Error("Patient Not found");
  }

   const databaseMedicines = await db.medicine.findMany({
    where: {
      id: {
        in: medicineIds,
      },
      is_active: true,
    },
    select: {
      id: true,
    },
  });

  if (databaseMedicines.length !== uniqueMedicineIds.size) {
    throw new Error(
      "One or more selected medicines are not available"
    );
  }

  for (const medicine of medicines) {
    if (!medicine.dosage?.trim()) {
      throw new Error("Dosage is required");
    }

    if (!medicine.frequency?.trim()) {
      throw new Error("Frequency is required");
    }

    if (!medicine.duration?.trim()) {
      throw new Error("Duration is required");
    }

    if (
      !Number.isInteger(medicine.quantity) ||
      medicine.quantity <= 0
    ) {
      throw new Error("Medicine quantity must be greater than 0");
    }
  }


    if (input.medical_id !== null && input.medical_id !== undefined) {
    const medicalRecord = await db.medicalRecords.findUnique({
      where: {
        id: input.medical_id,
      },
    });

    if (!medicalRecord) {
      throw new Error("Medical record not found");
    }

    if (medicalRecord.patient_id !== patientId) {
      throw new Error(
        "Medical record does not belong to this patient"
      );
    }
  }

  const Prescription = await db.prescription.create({
    data:{
        patient_id: patientId,
        doctor_id: doctor.id,
        medical_id:input.medical_id ?? null,
        status: "PENDING",
        notes: input.notes?.trim() || null,

        medicines:{
            create: medicines.map((medicine)=>({
                medicine_id: medicine.medicine_id,
                dosage: medicine.dosage.trim(),
                 frequency: medicine.frequency.trim(),
                 duration: medicine.duration.trim(),
                   quantity: medicine.quantity,

            })),
        }
    },
    include:{
        patient:{
            select:{
                id:true,
                patientNumber: true,
                first_name: true,
                last_name: true,
            },
        },
        medicines:{
            include:{
                medicine: true,
            },
        },
    },
  });
   revalidatePath("/doctor/prescriptions");
  revalidatePath("/pharmacy/prescriptions");

  return {
    success: true,
    Prescription,
  };

}

