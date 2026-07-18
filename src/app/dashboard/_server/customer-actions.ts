"use server";

import type { CustomerInfo } from "../types";
import { getCustomerProfile } from "./customer-profile";

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  return getCustomerProfile();
}
