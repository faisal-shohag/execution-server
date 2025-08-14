import { Router } from "express"
import { executionRoute } from "../api/execution/execution.route"

export const router = Router()

const moduleRoutes = [
    {
        path: "/compiler",
        route: executionRoute
    }
]

moduleRoutes.forEach((route) => {
    router.use(route.path, route.route)
})