import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase';

export default async function adminDashboard(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Total Users
    const { count: totalUsers } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Total Approved Sellers
    const { count: totalSellers } = await supabaseAdmin
      .from('seller_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')

    // Total Products
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Total Orders
    const { count: totalOrders } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Total Revenue (Paid Orders Only)
    const { data: revenueData } = await supabaseAdmin
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid')

    const totalRevenue =
      revenueData?.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0
      ) || 0

    // Pending Seller Applications
    const { count: pendingSellers } = await supabaseAdmin
      .from('seller_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Recent Orders (Last 5)
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select(
        'id, order_number, total_amount, status, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(5)

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalSellers: totalSellers || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        pendingSellers: pendingSellers || 0,
        recentOrders: recentOrders || []
      }
    })
  } catch (error) {
    console.error('Admin Dashboard API Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin dashboard data'
    })
  }
}
