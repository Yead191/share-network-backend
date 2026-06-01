import express from 'express';
import { UserRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { BookmarkRoutes } from '../modules/bookmark/bookmark.routes';
import { CategoryRoutes } from '../modules/category/category.route';
import { RuleRoutes } from '../modules/rule/rule.route';
import { FaqRoutes } from '../modules/faq/faq.route';
import { AdminRoutes } from '../modules/admin/auth/admin.route';
import { ChatRoutes } from '../modules/chat/chat.route';
import { MessageRoutes } from '../modules/message/message.route';
import { NotificationRoutes } from '../modules/notification/notification.routes';
import { PackageRoutes } from '../modules/package/package.routes';
import { ReviewRoutes } from '../modules/review/review.routes';
import { SubCategoryRoutes } from '../modules/subCategory/subCategory.route';
import { PortfolioRoutes } from '../modules/portfolio/portfolio.route';
import { ReservationRoutes } from '../modules/reservation/reservation.routes';
import { ReportRoutes } from '../modules/report/report.routes';
import { PaymentRoutes } from '../modules/payment/payment.routes';
import { OfferRoutes } from '../modules/offer/offer.routes';
import { MentorTimeTrackRoutes } from '../modules/mentor/timeTrack/time.route';
import { MentorReportRoutes } from '../modules/mentor/report/report.route';
import { LearningMaterialRoutes } from '../modules/mentor/lmetarial/learning.route';
import { MentorWoopRoutes } from '../modules/mentor/woops/woop.route';
import { StudentAdminPartRoutes } from '../modules/admin/students/management/students.route';
import { AttendenceRoutes } from '../modules/admin/students/attendence/attendence.route';
import { UserGroupRoutes } from '../modules/user-group/user-group.route';
import { TeacherRoutes } from '../modules/(teacher)/teacher/teacher.route';
import { ClassRoutes } from '../modules/(teacher)/class/class.route';
import { adminMentorRoutes } from '../modules/admin/mentor/mentor.route';
import { adminTeacherRoutes } from '../modules/admin/teacher/teacher.route';
import { EventRoutes } from '../modules/admin/event/event.route';
import { AssignmentRoutes } from '../modules/(teacher)/assignment/assignment.route';
import { RecentActivityRoutes } from '../modules/(teacher)/recentActivities/recentActivity.route';
import { AssignmentSubRoutes } from '../modules/students/assignments/assignmentSub.route';
import { CoordinatorRoutes } from '../modules/mentor-co-ordinator/coordinator.route';
import { AdminOnboardingRoutes } from '../modules/admin/onboarding/onboarding.route';
import { mentorDashboardRoutes } from '../modules/mentor/dashboard/dashboard.route';
import { goalRoutes } from '../modules/admin/goal/goal.route';
import { StudentStatsRoutes } from '../modules/students/studentstats/stat.route';
import { InternshipRoutes } from '../modules/internship/internship.routes';
const router = express.Router();

const apiRoutes = [
    { path: "/user", route: UserRoutes },
    { path: "/auth", route: AuthRoutes },
    { path: "/admin", route: AdminRoutes },
    { path: "/bookmark", route: BookmarkRoutes },
    { path: "/category", route: CategoryRoutes },
    { path: "/subCategory", route: SubCategoryRoutes },
    { path: "/mentor/time-track", route: MentorTimeTrackRoutes },
    { path: "/mentor/report", route: MentorReportRoutes },
    { path: "/learning", route: LearningMaterialRoutes },
    { path: "/mentor/woops", route: MentorWoopRoutes },
    { path: "/goal", route: goalRoutes },
    { path: "/student-admin", route: StudentAdminPartRoutes },
    { path: "/student-stats", route: StudentStatsRoutes },
    { path: "/student-attendance", route: AttendenceRoutes },
    { path: "/admin-mentor", route: adminMentorRoutes },
    { path: "/admin-teacher", route: adminTeacherRoutes },
    { path: "/admin-event", route: EventRoutes },
    { path: "/submission-assignment", route: AssignmentSubRoutes },
    { path: "/coordinator", route: CoordinatorRoutes },
    { path: "/onboarding", route: AdminOnboardingRoutes },
    { path: "/mentor-dashboard", route: mentorDashboardRoutes },
    { path: "/rule", route: RuleRoutes },
    { path: "/faq", route: FaqRoutes },
    { path: "/chat", route: ChatRoutes },
    { path: "/message", route: MessageRoutes },
    { path: "/notification", route: NotificationRoutes },
    { path: "/package", route: PackageRoutes },
    { path: "/review", route: ReviewRoutes },
    { path: "/portfolio", route: PortfolioRoutes },
    { path: "/reservation", route: ReservationRoutes },
    { path: "/report", route: ReportRoutes },
    { path: "/payment", route: PaymentRoutes },
    { path: "/offer", route: OfferRoutes },
    { path: "/user-group", route: UserGroupRoutes },
    { path: "/teacher", route: TeacherRoutes },
    { path: "/class", route: ClassRoutes },
    { path: "/assignment", route: AssignmentRoutes },
    { path: "/recent-activity", route: RecentActivityRoutes },
    { path: "/internship", route: InternshipRoutes },
]

apiRoutes.forEach(route => router.use(route.path, route.route));
export default router;