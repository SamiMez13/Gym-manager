import { Router, type IRouter } from "express";
import healthRouter from "./health";
import branchesRouter from "./branches";
import trainersRouter from "./trainers";
import membersRouter from "./members";
import classesRouter from "./classes";
import schedulesRouter from "./schedules";
import bookingsRouter from "./bookings";
import membershipPlansRouter from "./membership-plans";
import membershipsRouter from "./memberships";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(branchesRouter);
router.use(trainersRouter);
router.use(membersRouter);
router.use(classesRouter);
router.use(schedulesRouter);
router.use(bookingsRouter);
router.use(membershipPlansRouter);
router.use(membershipsRouter);
router.use(paymentsRouter);
router.use(dashboardRouter);

export default router;
