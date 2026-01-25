import ReactDOM from "react-dom/client";
// @ts-ignore
import { BrowserRouter as Router, Route, Routes, RouterProvider, createBrowserRouter } from "react-router-dom";
import Gallery from "./pages/Galery/gallery.tsx";
import Home from "./pages/Home/home.tsx";
import Users from "./pages/Users/users.tsx";
const router = createBrowserRouter([
    {
        path: "Monopoly",
        element: <Home />,
    },
    {
        path: "Monopoly/gallery",
        element: <Gallery />,
    },
    {
        path: "/Monopoly/users",
        element: <Users />,
    },
]);

function App() {
    return <RouterProvider router={router} />;
}

document.title = "Monopoly";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<App />);
