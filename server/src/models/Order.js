import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      phoneNormalized: { type: String, required: true, select: false },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Order Received',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        if (ret.customer) delete ret.customer.phoneNormalized;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export default mongoose.model('Order', orderSchema);
