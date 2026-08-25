"use server";

import db from "@/lib/db";

export async function getNotifications(clerkUserId: string) {
  try {
    // Collect all possible user IDs: the clerk ID itself,
    // plus any doctor or staff record mapped to this clerk user.
    const userIds: string[] = [clerkUserId];

    const doctor = await db.doctor.findFirst({
      where: { clerkUserId },
      select: { id: true },
    });
    if (doctor) userIds.push(doctor.id);

    const staff = await db.staff.findFirst({
      where: { clerkUserId },
      select: { id: true, role: true },
    });
    if (staff) {
      userIds.push(staff.id);
      userIds.push(`role:${staff.role}`);
    }

    // Check if user is a patient by email (via Clerk or DB)
    const patient = await db.patient.findFirst({
      where: {
        OR: [
          { email: clerkUserId },
          { id: clerkUserId },
        ],
      },
      select: { id: true },
    });
    if (patient) userIds.push(patient.id);

    const notifications = await db.notification.findMany({
      where: { user_id: { in: userIds } },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read,
      link: n.link,
      createdAt: n.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getUnreadCount(userId: string) {
  try {
    return await db.notification.count({
      where: { user_id: userId, is_read: false },
    });
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(id: number) {
  try {
    await db.notification.update({
      where: { id },
      data: { is_read: true },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await db.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  try {
    await db.notification.create({
      data: {
        user_id: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || null,
      },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
