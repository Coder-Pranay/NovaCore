package com.novacore.dashboard;

import com.novacore.activity.ActivityLogService;
import com.novacore.activity.dto.ActivityResponse;
import com.novacore.common.api.ApiResponse;
import com.novacore.dashboard.dto.DashboardResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final ActivityLogService activityLogService;

    public DashboardController(DashboardService dashboardService, ActivityLogService activityLogService) {
        this.dashboardService = dashboardService;
        this.activityLogService = activityLogService;
    }

    @GetMapping
    public ApiResponse<DashboardResponse> getDashboard() {
        DashboardResponse dashboard = dashboardService.getDashboard();
        return ApiResponse.success(dashboard, "Dashboard retrieved successfully");
    }

    @GetMapping("/activity")
    public ApiResponse<List<ActivityResponse>> getRecentActivity() {
        List<ActivityResponse> activities = activityLogService.getRecentActivitiesForCurrentUser();
        return ApiResponse.success(activities, "Recent activity retrieved successfully");
    }
}
