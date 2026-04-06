import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import MoodCheckIn from "./pages/MoodCheckIn";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import AIInsights from "./pages/AIInsights";
import DrawingSpace from "./pages/DrawingSpace";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: Layout,
        children: [
            { index: true, Component: MoodCheckIn },
            { path: "dashboard", Component: Dashboard },
            { path: "calendar", Component: Calendar },
            { path: "insights", Component: AIInsights },
            { path: "drawing", Component: DrawingSpace },
        ],
    },
]);
