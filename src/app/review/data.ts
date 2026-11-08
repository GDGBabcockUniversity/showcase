import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  collaborationRequest,
  collaborationRequestReport,
  project,
  user,
} from "@/db/schema";

export async function getQueue() {
  return db
    .select({
      id: project.id,
      title: project.title,
      status: project.status,
      createdAt: project.createdAt,
      by: user.name,
      cover: project.cover,
      department: project.department,
    })
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .where(
      and(
        eq(project.draft, false),
        inArray(project.status, ["PENDING", "CHANGES_REQUESTED"]),
      ),
    )
    .orderBy(asc(project.createdAt));
}

const reviewer = alias(user, "reviewer");

export async function getRecentDecisions() {
  return db
    .select({
      id: project.id,
      title: project.title,
      status: project.status,
      note: project.reviewNote,
      reviewedAt: project.reviewedAt,
      by: user.name,
      reviewer: reviewer.name,
    })
    .from(project)
    .innerJoin(user, eq(project.userId, user.id))
    .leftJoin(reviewer, eq(project.reviewedBy, reviewer.id))
    .where(isNotNull(project.reviewedAt))
    .orderBy(desc(project.reviewedAt))
    .limit(6);
}

export async function getOpenReports() {
  return db
    .select({
      requestId: collaborationRequest.id,
      projectId: project.id,
      title: project.title,
      message: collaborationRequest.message,
      reporter: user.name,
      reason: collaborationRequestReport.reason,
    })
    .from(collaborationRequestReport)
    .innerJoin(
      collaborationRequest,
      eq(collaborationRequest.id, collaborationRequestReport.requestId),
    )
    .innerJoin(project, eq(project.id, collaborationRequest.projectId))
    .innerJoin(user, eq(user.id, collaborationRequestReport.reportedBy));
}
