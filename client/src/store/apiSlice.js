import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_URL}/api` }),
  tagTypes: ["Menu", "Order"],
  endpoints: (builder) => ({
    getMenu: builder.query({ query: () => "/menu", providesTags: ["Menu"] }),
    placeOrder: builder.mutation({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Order"],
    }),
    getOrder: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Order", id }],
    }),
    getOrders: builder.query({
      query: (phone) => ({
        url: "/orders",
        params: phone ? { phone } : undefined,
      }),
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Order",
        { type: "Order", id },
      ],
    }),
  }),
});

export const {
  useGetMenuQuery,
  usePlaceOrderMutation,
  useGetOrderQuery,
  useLazyGetOrdersQuery,
  useUpdateOrderStatusMutation,
} = apiSlice;

export function getApiErrorMessage(error) {
  if (!error) return "Request failed";
  if (typeof error === "string") return error;
  return (
    error.data?.errors?.join(" ") ||
    error.data?.message ||
    error.error ||
    "Request failed"
  );
}
