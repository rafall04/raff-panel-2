/**
 * Example: How to use API Client
 *
 * This file shows examples of how to use the API client in different scenarios.
 * DO NOT import this file in production code.
 */

import { apiClient } from "./api-client";
import { CustomerService } from "@/services/customer.service";
import { getErrorMessage } from "@/utils/error-handler";

// Example 1: Basic GET request
export async function example1() {
  try {
    const response = await apiClient.get("/api/customer/profile");
    if (response.success && response.data) {
      console.error("Profile:", response.data);
    }
  } catch (error) {
    console.error(getErrorMessage(error));
  }
}

// Example 2: POST request with data
export async function example2() {
  try {
    const response = await apiClient.post("/api/reports", {
      category: "technical",
      description: "Issue description",
    });
    if (response.success) {
      console.error("Report submitted:", response.data);
    }
  } catch (error) {
    console.error(getErrorMessage(error));
  }
}

// Example 3: Using Service Layer (Recommended)
export async function example3() {
  try {
    const response = await CustomerService.getProfile();
    if (response.success && response.data) {
      console.error("Profile:", response.data);
    }
  } catch (error) {
    console.error(getErrorMessage(error));
  }
}

// Example 4: Request without authentication
export async function example4() {
  try {
    const response = await apiClient.get("/api/public/news", {
      requireAuth: false,
    });
    console.error("News:", response.data);
  } catch (error) {
    console.error(getErrorMessage(error));
  }
}

// Example 5: Custom timeout
export async function example5() {
  try {
    const response = await apiClient.get("/api/slow-endpoint", {
      timeout: 10000, // 10 seconds
    });
    console.error("Data:", response.data);
  } catch (error) {
    console.error(getErrorMessage(error));
  }
}
