"use server";

import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/db/audit";
import { Permission } from "@/lib/auth/permissions";
import { getLabActor } from "@/lib/lab/lab-actor";
import { labTemplateSchema } from "@/lib/lab/lab-validation";

type CreateLabTestInput = {
    service_name: string;
    description: string;
    price: number;
};

export async function createLabTest(input: CreateLabTestInput){
    const {userId, sessionClaims} = await auth();

    if(!userId){
        return {success: false, message: "Please Sign in first."};
    }

    const claims = sessionClaims as {
    metadata?: { role?: string };
  } | null;

  const role = claims?.metadata?.role;
    if (!["SuperAdmin", "admin", "LabTechnician"].includes(role ?? "")) {
    return {
      success: false,
      message: "You do not have permission to add laboratory tests.",
    };
  }

  const service_name =input.service_name?.trim();
  const description =input.description?.trim();
  const price =Number(input.price);
    if(!service_name || service_name.length > 150){
    return {
        success: false,
        message: "Enter a test name of 1-150 characters.",
    }
  }
  if(!description || description.length > 1000){
    return {
        success: false,
        message: "Enter a description of 1-1000 characters."
    };
  }
  try{
    const existing = await db.service.findFirst({
        where:{
            service_name:{
                equals: service_name,
                mode: "insensitive",
            },
        },
        select:{id: true},
    });
    if(existing){
        return {
            success: false,
            message: "A service with this name already exists."
        };
    }
    await db.service.create({
        data:{
            service_name,
            description,
            price,
        },
    });
    revalidatePath("/lab/catalog");
    revalidatePath("/lab");
    return {
        success: true,
        message: "Laboratory test added successfully"
    }
  }
  catch{
    return {
      success: false,
      message: "Unable to save the test. Please try again.",
    };

  }
}

/**
 * Stores the result sheet of a laboratory service.
 *
 * The parameters and their reference ranges are configured by the laboratory,
 * so the values that are entered in the result sheet always follow the
 * validated policy of the hospital.
 */
export async function saveLabTestTemplate(input: {
  serviceId: number;
  templateKey: string;
  specimen: string;
  parameters: unknown;
}) {
  const actor = await getLabActor(Permission.CONFIGURE_LAB_TESTS);

  if (!actor.ok) {
    return { success: false, message: actor.message };
  }

  const parsed = labTemplateSchema.safeParse({
    serviceId: input.serviceId,
    templateKey: input.templateKey,
    specimen: input.specimen,
    parameters: input.parameters,
  });

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ??
        "The result sheet of the test is incomplete.",
    };
  }

  const names = parsed.data.parameters.map((parameter) => parameter.name);
  const unique = new Set(names);

  if (unique.size !== names.length) {
    return {
      success: false,
      message: "Every parameter of a result sheet can only be used once.",
    };
  }

  const service = await db.service.findUnique({
    where: { id: parsed.data.serviceId },
    select: { id: true, service_name: true },
  });

  if (!service) {
    return { success: false, message: "The laboratory test was not found." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.labTestTemplate.upsert({
        where: { service_id: service.id },
        create: {
          service_id: service.id,
          template_key: parsed.data.templateKey,
          specimen: parsed.data.specimen || null,
          parameters: parsed.data.parameters,
        },
        update: {
          template_key: parsed.data.templateKey,
          specimen: parsed.data.specimen || null,
          parameters: parsed.data.parameters,
          is_active: true,
        },
      });
    });

    await createAuditLog({
      userId: actor.actor.staffId,
      recordId: String(service.id),
      action: "configure_lab_test_template",
      details: `Result sheet of ${service.service_name} configured by ${actor.actor.name}.`,
      model: "LabTestTemplate",
    });

    revalidatePath("/lab/catalog");
    revalidatePath("/lab/orders");
    revalidatePath("/lab/results");

    return {
      success: true,
      message: `The result sheet of ${service.service_name} was saved.`,
    };
  } catch (error) {
    console.error("Failed to save laboratory test template:", error);

    return {
      success: false,
      message: "Unable to save the result sheet. Please try again.",
    };
  }
}