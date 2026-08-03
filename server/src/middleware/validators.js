import { ORDER_STATUSES } from '../models/Order.js';

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPositiveNumber(v) {
  return typeof v === 'number' && !Number.isNaN(v) && v >= 0;
}

const PHONE_REGEX = /^\d{10}$/;

function validateMenuItem(req, res, next) {
  const { name, description, price, image } = req.body;
  const errors = [];

  if (!isNonEmptyString(name)) errors.push('name is required and must be a non-empty string.');
  if (!isNonEmptyString(description)) errors.push('description is required and must be a non-empty string.');
  if (price === undefined || !isPositiveNumber(Number(price))) errors.push('price is required and must be a number >= 0.');
  if (!isNonEmptyString(image)) errors.push('image is required and must be a non-empty string (URL).');

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  req.body.price = Number(price);
  next();
}

function validateOrderInput(req, res, next) {
  const { items, customer } = req.body;
  const errors = [];

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('items must be a non-empty array.');
  } else {
    items.forEach((item, idx) => {
      if (!isNonEmptyString(item.menuItemId)) {
        errors.push(`items[${idx}].menuItemId is required.`);
      }
      if (
        item.quantity === undefined ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        errors.push(`items[${idx}].quantity must be an integer >= 1.`);
      }
    });
  }

  if (!customer || typeof customer !== 'object') {
    errors.push('customer details are required.');
  } else {
    if (!isNonEmptyString(customer.name)) errors.push('customer.name is required.');
    if (!isNonEmptyString(customer.address)) errors.push('customer.address is required.');
    if (!isNonEmptyString(customer.phone) || !PHONE_REGEX.test(customer.phone.trim())) {
      errors.push('customer.phone must contain exactly 10 digits and numbers only.');
    }
  }

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
}

function validateStatusUpdate(req, res, next) {
  const { status } = req.body;
  if (!isNonEmptyString(status) || !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: [`status must be one of: ${ORDER_STATUSES.join(', ')}`],
    });
  }
  next();
}

export { validateMenuItem, validateOrderInput, validateStatusUpdate };
