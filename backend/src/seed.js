require('dotenv').config();
const sequelize = require('./config/database');
const {
  Role,
  User,
  Branch,
  Category,
  Product,
  Stock,
  Supplier,
  Customer,
} = require('./models');
const { hashPassword } = require('./utils/password');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database. Starting seed...');

    // --- Roles ---
    const adminRole = await Role.create({
      name: 'admin',
      permissions: ['*'],
    });
    const managerRole = await Role.create({
      name: 'manager',
      permissions: ['pos', 'inventory.view', 'inventory.edit', 'purchasing', 'reports', 'customers', 'stock.adjust', 'stock.transfer'],
    });
    const cashierRole = await Role.create({
      name: 'cashier',
      permissions: ['pos', 'customers', 'reports.sales'],
    });
    const inventoryRole = await Role.create({
      name: 'inventory_staff',
      permissions: ['inventory.view', 'inventory.edit', 'purchasing', 'stock.adjust', 'reports.stock'],
    });

    console.log('Roles created.');

    // --- Branches ---
    const hq = await Branch.create({
      name: 'Main Store',
      code: 'HQ',
      address: '123 Main Street, Downtown',
      phone: '555-0100',
      email: 'main@store.com',
      isHeadquarters: true,
    });
    const branch2 = await Branch.create({
      name: 'Branch North',
      code: 'BR-N',
      address: '456 North Avenue',
      phone: '555-0101',
      email: 'north@store.com',
    });

    console.log('Branches created.');

    // --- Users ---
    const adminPass = await hashPassword('admin123');
    const managerPass = await hashPassword('manager123');
    const cashierPass = await hashPassword('cashier123');
    const inventoryPass = await hashPassword('inventory123');

    await User.create({
      username: 'admin',
      email: 'admin@invpos.com',
      passwordHash: adminPass,
      roleId: adminRole.id,
      branchId: hq.id,
      firstName: 'System',
      lastName: 'Admin',
      phone: '555-0001',
    });

    await User.create({
      username: 'manager',
      email: 'manager@invpos.com',
      passwordHash: managerPass,
      roleId: managerRole.id,
      branchId: hq.id,
      firstName: 'Store',
      lastName: 'Manager',
      phone: '555-0002',
    });

    await User.create({
      username: 'cashier',
      email: 'cashier@invpos.com',
      passwordHash: cashierPass,
      roleId: cashierRole.id,
      branchId: hq.id,
      firstName: 'John',
      lastName: 'Cashier',
      phone: '555-0003',
    });

    await User.create({
      username: 'cashier2',
      email: 'cashier2@invpos.com',
      passwordHash: cashierPass,
      roleId: cashierRole.id,
      branchId: branch2.id,
      firstName: 'Jane',
      lastName: 'Cashier',
      phone: '555-0004',
    });

    await User.create({
      username: 'inventory',
      email: 'inventory@invpos.com',
      passwordHash: inventoryPass,
      roleId: inventoryRole.id,
      branchId: hq.id,
      firstName: 'Stock',
      lastName: 'Keeper',
      phone: '555-0005',
    });

    console.log('Users created.');

    // --- Categories ---
    const beverages = await Category.create({ name: 'Beverages', description: 'Drinks and liquids' });
    const snacks = await Category.create({ name: 'Snacks', description: 'Snack foods' });
    const dairy = await Category.create({ name: 'Dairy', description: 'Dairy products' });
    const bakery = await Category.create({ name: 'Bakery', description: 'Baked goods' });
    const household = await Category.create({ name: 'Household', description: 'Household items' });
    const electronics = await Category.create({ name: 'Electronics', description: 'Electronic items' });

    const softDrinks = await Category.create({ name: 'Soft Drinks', parentId: beverages.id });
    const water = await Category.create({ name: 'Water', parentId: beverages.id });

    console.log('Categories created.');

    // --- Products ---
    const products = [
      { sku: 'BEV-001', name: 'Cola 500ml', categoryId: softDrinks.id, unit: 'bottle', costPrice: 0.80, salePrice: 1.50, taxRate: 5, reorderThreshold: 24, barcode: '5000123000011' },
      { sku: 'BEV-002', name: 'Orange Juice 1L', categoryId: softDrinks.id, unit: 'carton', costPrice: 1.50, salePrice: 3.00, taxRate: 5, reorderThreshold: 12, barcode: '5000123000028' },
      { sku: 'BEV-003', name: 'Mineral Water 1.5L', categoryId: water.id, unit: 'bottle', costPrice: 0.40, salePrice: 1.00, taxRate: 0, reorderThreshold: 48, barcode: '5000123000035' },
      { sku: 'SNK-001', name: 'Potato Chips 150g', categoryId: snacks.id, unit: 'pack', costPrice: 0.75, salePrice: 1.80, taxRate: 10, reorderThreshold: 36, barcode: '5000123000042' },
      { sku: 'SNK-002', name: 'Chocolate Bar 100g', categoryId: snacks.id, unit: 'bar', costPrice: 0.50, salePrice: 1.20, taxRate: 10, reorderThreshold: 48, barcode: '5000123000059' },
      { sku: 'SNK-003', name: 'Cookies Pack 200g', categoryId: snacks.id, unit: 'pack', costPrice: 1.00, salePrice: 2.50, taxRate: 10, reorderThreshold: 24, barcode: '5000123000066' },
      { sku: 'DRY-001', name: 'Fresh Milk 1L', categoryId: dairy.id, unit: 'carton', costPrice: 0.90, salePrice: 2.00, taxRate: 0, reorderThreshold: 20, hasBatchTracking: true, barcode: '5000123000073' },
      { sku: 'DRY-002', name: 'Cheddar Cheese 250g', categoryId: dairy.id, unit: 'pack', costPrice: 2.00, salePrice: 4.50, taxRate: 0, reorderThreshold: 15, hasBatchTracking: true, barcode: '5000123000080' },
      { sku: 'DRY-003', name: 'Greek Yogurt 500g', categoryId: dairy.id, unit: 'tub', costPrice: 1.20, salePrice: 2.80, taxRate: 0, reorderThreshold: 18, hasBatchTracking: true, barcode: '5000123000097' },
      { sku: 'BAK-001', name: 'White Bread Loaf', categoryId: bakery.id, unit: 'loaf', costPrice: 0.60, salePrice: 1.50, taxRate: 0, reorderThreshold: 30, barcode: '5000123000103' },
      { sku: 'BAK-002', name: 'Croissant 6-pack', categoryId: bakery.id, unit: 'pack', costPrice: 1.80, salePrice: 3.99, taxRate: 0, reorderThreshold: 12, barcode: '5000123000110' },
      { sku: 'HSH-001', name: 'Dish Soap 750ml', categoryId: household.id, unit: 'bottle', costPrice: 1.50, salePrice: 3.50, taxRate: 15, reorderThreshold: 20, barcode: '5000123000127' },
      { sku: 'HSH-002', name: 'Paper Towels 4-roll', categoryId: household.id, unit: 'pack', costPrice: 2.00, salePrice: 4.99, taxRate: 15, reorderThreshold: 15, barcode: '5000123000134' },
      { sku: 'HSH-003', name: 'Laundry Detergent 2L', categoryId: household.id, unit: 'bottle', costPrice: 3.50, salePrice: 7.99, taxRate: 15, reorderThreshold: 10, barcode: '5000123000141' },
      { sku: 'ELE-001', name: 'AA Batteries 4-pack', categoryId: electronics.id, unit: 'pack', costPrice: 1.50, salePrice: 3.99, taxRate: 20, reorderThreshold: 20, barcode: '5000123000158' },
      { sku: 'ELE-002', name: 'USB Cable Type-C 1m', categoryId: electronics.id, unit: 'piece', costPrice: 2.00, salePrice: 5.99, taxRate: 20, reorderThreshold: 15, barcode: '5000123000165' },
      { sku: 'ELE-003', name: 'Phone Charger 20W', categoryId: electronics.id, unit: 'piece', costPrice: 5.00, salePrice: 12.99, taxRate: 20, reorderThreshold: 10, barcode: '5000123000172' },
    ];

    const createdProducts = [];
    for (const p of products) {
      const product = await Product.create(p);
      createdProducts.push(product);
    }

    console.log(`${createdProducts.length} products created.`);

    // --- Stock ---
    for (const product of createdProducts) {
      await Stock.create({
        productId: product.id,
        branchId: hq.id,
        quantity: Math.floor(Math.random() * 100) + 20,
        minStockLevel: product.reorderThreshold,
      });

      await Stock.create({
        productId: product.id,
        branchId: branch2.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        minStockLevel: product.reorderThreshold,
      });
    }

    console.log('Stock levels created.');

    // --- Suppliers ---
    await Supplier.create({
      name: 'Global Beverages Inc.',
      contactPerson: 'Mike Johnson',
      email: 'mike@globalbev.com',
      phone: '555-1001',
      address: '100 Supplier St, Industrial Zone',
      paymentTerms: 'Net 30',
    });

    await Supplier.create({
      name: 'Fresh Dairy Co.',
      contactPerson: 'Sarah Lee',
      email: 'sarah@freshdairy.com',
      phone: '555-1002',
      address: '200 Dairy Farm Road',
      paymentTerms: 'Net 15',
    });

    await Supplier.create({
      name: 'Snack Foods Distribution',
      contactPerson: 'Tom Wilson',
      email: 'tom@snackdist.com',
      phone: '555-1003',
      address: '300 Commerce Blvd',
      paymentTerms: 'Net 45',
    });

    await Supplier.create({
      name: 'Tech Supplies Ltd.',
      contactPerson: 'Lisa Chen',
      email: 'lisa@techsupplies.com',
      phone: '555-1004',
      address: '400 Tech Park Avenue',
      paymentTerms: 'Net 30',
    });

    console.log('Suppliers created.');

    // --- Customers ---
    await Customer.create({
      name: 'Walk-in Customer',
      phone: '',
      email: '',
    });

    await Customer.create({
      name: 'Alice Anderson',
      email: 'alice@example.com',
      phone: '555-2001',
      address: '101 Customer Lane',
      loyaltyPoints: 150,
    });

    await Customer.create({
      name: 'Bob Brown',
      email: 'bob@example.com',
      phone: '555-2002',
      address: '102 Customer Lane',
      loyaltyPoints: 75,
    });

    await Customer.create({
      name: 'Carol Clark',
      email: 'carol@example.com',
      phone: '555-2003',
      address: '103 Customer Lane',
      loyaltyPoints: 320,
    });

    await Customer.create({
      name: 'David Davis',
      email: 'david@example.com',
      phone: '555-2004',
      address: '104 Customer Lane',
      loyaltyPoints: 10,
    });

    console.log('Customers created.');

    console.log('\n========================================');
    console.log('Seed data inserted successfully!');
    console.log('========================================');
    console.log('\nLogin credentials:');
    console.log('  Admin:      admin / admin123');
    console.log('  Manager:    manager / manager123');
    console.log('  Cashier:    cashier / cashier123');
    console.log('  Inventory:  inventory / inventory123');
    console.log('\n');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
