import { PrismaClient, Role, BillingFrequency, TaxType, DiscountType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting BrightLoop Database Seeding...");

  // 1. Create Default Admin User
  const adminPasswordHash = await bcrypt.hash("Admin@BrightLoop2026!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@brightloop.com" },
    update: {},
    create: {
      email: "admin@brightloop.com",
      name: "System Administrator",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user seeded: ${admin.email}`);

  // 2. Create Default Staff User
  const staffPasswordHash = await bcrypt.hash("Staff@BrightLoop2026!", 12);
  const staff = await prisma.user.upsert({
    where: { email: "staff@brightloop.com" },
    update: {},
    create: {
      email: "staff@brightloop.com",
      name: "Operations Staff",
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });
  console.log(`✅ Staff user seeded: ${staff.email}`);

  // 3. Create Default Customer User & Commercial Profile
  const customerPasswordHash = await bcrypt.hash("Customer@BrightLoop2026!", 12);
  const customerUser = await prisma.user.upsert({
    where: { email: "customer@acmecorp.com" },
    update: {},
    create: {
      email: "customer@acmecorp.com",
      name: "John Doe",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
      isActive: true,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { email: "customer@acmecorp.com" },
    update: {},
    create: {
      userId: customerUser.id,
      companyName: "Acme Enterprises Inc.",
      contactName: "John Doe",
      email: "customer@acmecorp.com",
      phone: "+91 9876543210",
      billingAddress: "42 Tech Boulevard, Silicon Square, Bangalore, India",
      taxId: "GSTIN29AAACA1234A1Z5",
      isActive: true,
    },
  });
  console.log(`✅ Customer seeded: ${customer.companyName} (${customer.email})`);

  // 4. Create Product with Variants
  const crmProduct = await prisma.product.upsert({
    where: { id: "crm-prod-001" },
    update: {},
    create: {
      id: "crm-prod-001",
      name: "BrightLoop CRM Suite",
      type: "SOFTWARE",
      salesPrice: 2000.0,
      costPrice: 500.0,
      description: "Comprehensive recurring customer relationship management suite",
      isActive: true,
      variants: {
        create: [
          {
            name: "Standard",
            priceAdjustment: 0.0,
            isActive: true,
          },
          {
            name: "Odoo Connector",
            priceAdjustment: 560.0,
            isActive: true,
          },
          {
            name: "Enterprise Multi-Tenant",
            priceAdjustment: 1000.0,
            isActive: true,
          },
        ],
      },
    },
  });
  console.log(`✅ Product & variants seeded: ${crmProduct.name}`);

  // 5. Create Subscription Plans
  const monthlyPlan = await prisma.plan.upsert({
    where: { id: "plan-monthly-std" },
    update: {},
    create: {
      id: "plan-monthly-std",
      name: "Standard Monthly Growth",
      description: "Billed on a monthly recurring basis with pause and early closure options",
      price: 2000.0,
      billingFrequency: BillingFrequency.MONTHLY,
      billingInterval: 1,
      minQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnExpiry: false,
      isActive: true,
    },
  });

  const yearlyPlan = await prisma.plan.upsert({
    where: { id: "plan-yearly-ent" },
    update: {},
    create: {
      id: "plan-yearly-ent",
      name: "Enterprise Annual Contract",
      description: "Billed annually with 2 months free equivalent pricing",
      price: 20000.0,
      billingFrequency: BillingFrequency.YEARLY,
      billingInterval: 1,
      minQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnExpiry: false,
      isActive: true,
    },
  });
  console.log(`✅ Plans seeded: ${monthlyPlan.name}, ${yearlyPlan.name}`);

  // 6. Create Tax Rules
  const gstTax = await prisma.taxRule.upsert({
    where: { id: "tax-gst-18" },
    update: {},
    create: {
      id: "tax-gst-18",
      name: "GST 18%",
      taxRate: 18.0,
      taxType: TaxType.PERCENTAGE,
      isDefault: true,
      isActive: true,
    },
  });
  console.log(`✅ Tax rule seeded: ${gstTax.name}`);

  // 7. Create Promotional Discount
  const promoDiscount = await prisma.discount.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      name: "New Customer Welcome Discount",
      discountType: DiscountType.PERCENTAGE,
      value: 10.0,
      minPurchaseAmount: 1000.0,
      maxUsageCount: 100,
      isActive: true,
    },
  });
  console.log(`✅ Discount seeded: ${promoDiscount.code} (${promoDiscount.name})`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
