import db from "@/lib/db";
import {
  groupLabTestsIntoOrders,
  labOrderTestInclude,
} from "@/lib/db/lab-order-groups";
import { resolveOrderStage } from "@/lib/lab/order-status";

/**
 * The metrics of the laboratory dashboard. Every number comes from the
 * database, nothing is hard coded.
 */
export async function getLabDashboardData() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const [rows, statusGroups, urgentTests] = await Promise.all([
    db.labTest.findMany({
      orderBy: {
        created_at: "desc",
      },
      include: labOrderTestInclude,
    }),
    db.labTest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.labTest.count({
      where: {
        status: "Urgent",
      },
    }),
  ]);

  const orders = groupLabTestsIntoOrders(rows);

  const countByStatus = new Map<string, number>();

  for (const group of statusGroups) {
    countByStatus.set(group.status, group._count._all);
  }

  const countOf = (status: string) => countByStatus.get(status) ?? 0;

  const pendingOrders = orders.filter((order) => {
    const stage = resolveOrderStage(
      order.tests.map((test) => test.status)
    );

    return stage === "Pending";
  }).length;

  const samplesCollected = orders.filter((order) => {
    const stage = resolveOrderStage(
      order.tests.map((test) => test.status)
    );

    return stage === "Sample Collected";
  }).length;

  const awaitingReview = orders.filter((order) => {
    const stage = resolveOrderStage(
      order.tests.map((test) => test.status)
    );

    return stage === "Under Review";
  }).length;

  const completedToday = orders.filter((order) => {
    const stage = resolveOrderStage(
      order.tests.map((test) => test.status)
    );

    if (stage !== "Completed" && stage !== "Released") {
      return false;
    }

    const completedAt = order.updatedAt.getTime();

    return (
      completedAt >= startOfDay.getTime() &&
      completedAt <= endOfDay.getTime()
    );
  }).length;

  return {
    metrics: {
      totalOrders: orders.length,
      totalTests: rows.length,
      totalPending: pendingOrders,
      pendingTests: countOf("Pending") + countOf("Sample Collected"),
      inProgressTests: countOf("In Progress"),
      awaitingReviewTests: countOf("Under Review"),
      verifiedTests: countOf("Verified"),
      releasedTests: countOf("Released"),
      samplesCollected,
      awaitingReviewOrders: awaitingReview,
      completedToday,
      urgentTests,
    },
    recentOrders: orders.slice(0, 8).map((order) => ({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      testNames: order.tests.map((test) => test.name).join(", "),
      testCount: order.testCount,
      patientName: order.patientName,
      patientNumber: order.patientNumber,
      status: order.status,
      testDate: order.testDate.toISOString(),
    })),
  };
}
