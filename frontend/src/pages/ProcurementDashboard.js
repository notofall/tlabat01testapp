import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  Package,
  LogOut,
  Clock,
  CheckCircle,
  RefreshCw,
  FileText,
  ShoppingCart,
  Truck,
  Eye,
  Download,
} from "lucide-react";
import { exportRequestToPDF, exportPurchaseOrderToPDF, exportRequestsTableToPDF, exportPurchaseOrdersTableToPDF } from "../utils/pdfExport";

const ProcurementDashboard = () => {
  const { user, logout, getAuthHeaders, API_URL } = useAuth();
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [viewRequestDialogOpen, setViewRequestDialogOpen] = useState(false);
  const [viewOrderDialogOpen, setViewOrderDialogOpen] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [requestsRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/requests`, getAuthHeaders()),
        axios.get(`${API_URL}/purchase-orders`, getAuthHeaders()),
        axios.get(`${API_URL}/dashboard/stats`, getAuthHeaders()),
      ]);
      setRequests(requestsRes.data);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async () => {
    if (!supplierName.trim()) {
      toast.error("الرجاء إدخال اسم المورد");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${API_URL}/purchase-orders`,
        {
          request_id: selectedRequest.id,
          supplier_name: supplierName,
          notes: orderNotes,
        },
        getAuthHeaders()
      );
      toast.success("تم إصدار أمر الشراء بنجاح");
      setOrderDialogOpen(false);
      setSupplierName("");
      setOrderNotes("");
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إصدار أمر الشراء");
    } finally {
      setSubmitting(false);
    }
  };

  const openViewRequestDialog = (request) => {
    setSelectedRequest(request);
    setViewRequestDialogOpen(true);
  };

  const openViewOrderDialog = (order) => {
    setSelectedOrder(order);
    setViewOrderDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_engineer: { label: "بانتظار المهندس", variant: "warning" },
      approved_by_engineer: { label: "معتمد من المهندس", variant: "success" },
      rejected_by_engineer: { label: "مرفوض", variant: "destructive" },
      purchase_order_issued: { label: "تم إصدار أمر الشراء", variant: "default" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary" };

    const variantClasses = {
      warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
      success: "bg-green-50 text-green-800 border-green-200",
      destructive: "bg-red-50 text-red-800 border-red-200",
      default: "bg-blue-50 text-blue-800 border-blue-200",
      secondary: "bg-slate-50 text-slate-800 border-slate-200",
    };

    return (
      <Badge className={`${variantClasses[statusInfo.variant]} border font-medium`}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-sm flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold">نظام طلبات المواد</h1>
                <p className="text-sm text-slate-400">لوحة تحكم مدير المشتريات</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-300">مرحباً، {user?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-r-4 border-r-yellow-500 hover-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">طلبات تحتاج أمر شراء</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending_orders || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-green-500 hover-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">أوامر الشراء المصدرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.total_orders || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Approved Requests Awaiting Purchase Order */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              طلبات معتمدة تحتاج أمر شراء
              {requests.length > 0 && (
                <span className="bg-yellow-500 text-white text-sm px-2 py-1 rounded-full">
                  {requests.length}
                </span>
              )}
            </h2>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => exportRequestsTableToPDF(requests, 'طلبات معتمدة')}
                className="border-slate-300"
                disabled={requests.length === 0}
                data-testid="export-requests-pdf-btn"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير الطلبات
              </Button>
              <Button
                variant="outline"
                onClick={fetchData}
                className="border-slate-300"
                data-testid="refresh-btn"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                تحديث
              </Button>
            </div>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد طلبات معلقة</h3>
                  <p className="text-slate-500">جميع الطلبات تم إصدار أوامر شراء لها</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right font-bold">اسم المادة</TableHead>
                      <TableHead className="text-right font-bold">الكمية</TableHead>
                      <TableHead className="text-right font-bold">المشروع</TableHead>
                      <TableHead className="text-right font-bold">المشرف</TableHead>
                      <TableHead className="text-right font-bold">المهندس المعتمد</TableHead>
                      <TableHead className="text-right font-bold">التاريخ</TableHead>
                      <TableHead className="text-right font-bold">الإجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} className="table-row-hover" data-testid={`approved-request-${request.id}`}>
                        <TableCell className="font-medium">{request.material_name}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>{request.project_name}</TableCell>
                        <TableCell>{request.supervisor_name}</TableCell>
                        <TableCell>{request.engineer_name}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openViewRequestDialog(request)}
                              className="h-8 w-8 p-0"
                              data-testid={`view-request-btn-${request.id}`}
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => exportRequestToPDF(request)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                              onClick={() => {
                                setSelectedRequest(request);
                                setOrderDialogOpen(true);
                              }}
                              data-testid={`create-order-btn-${request.id}`}
                            >
                              <ShoppingCart className="w-4 h-4 ml-1" />
                              إصدار أمر
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-6 h-6 text-green-600" />
              أوامر الشراء المصدرة
            </h2>
            <Button
              variant="outline"
              onClick={() => exportPurchaseOrdersTableToPDF(orders)}
              className="border-slate-300"
              disabled={orders.length === 0}
              data-testid="export-orders-pdf-btn"
            >
              <Download className="w-4 h-4 ml-2" />
              تصدير الأوامر
            </Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">لا توجد أوامر شراء</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right font-bold">اسم المادة</TableHead>
                      <TableHead className="text-right font-bold">الكمية</TableHead>
                      <TableHead className="text-right font-bold">المشروع</TableHead>
                      <TableHead className="text-right font-bold">المورد</TableHead>
                      <TableHead className="text-right font-bold">ملاحظات</TableHead>
                      <TableHead className="text-right font-bold">تاريخ الإصدار</TableHead>
                      <TableHead className="text-right font-bold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="table-row-hover" data-testid={`purchase-order-${order.id}`}>
                        <TableCell className="font-medium">{order.material_name}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{order.project_name}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-50 text-green-800 border-green-200 border">
                            {order.supplier_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-500">
                          {order.notes || "-"}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openViewOrderDialog(order)}
                              className="h-8 w-8 p-0"
                              data-testid={`view-order-btn-${order.id}`}
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => exportPurchaseOrderToPDF(order)}
                              className="h-8 w-8 p-0"
                              data-testid={`export-order-btn-${order.id}`}
                            >
                              <Download className="w-4 h-4 text-green-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* View Request Dialog */}
      <Dialog open={viewRequestDialogOpen} onOpenChange={setViewRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">تفاصيل الطلب</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم المادة:</span>
                  <span className="font-semibold">{selectedRequest.material_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الكمية:</span>
                  <span className="font-semibold">{selectedRequest.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المشروع:</span>
                  <span className="font-semibold">{selectedRequest.project_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المشرف:</span>
                  <span className="font-semibold">{selectedRequest.supervisor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المهندس المعتمد:</span>
                  <span className="font-semibold">{selectedRequest.engineer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الحالة:</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ:</span>
                  <span className="font-semibold">{formatDate(selectedRequest.created_at)}</span>
                </div>
                <div className="pt-2 border-t">
                  <span className="text-slate-500 block mb-1">سبب الطلب:</span>
                  <p className="font-medium">{selectedRequest.reason}</p>
                </div>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => exportRequestToPDF(selectedRequest)}
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewOrderDialogOpen} onOpenChange={setViewOrderDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">تفاصيل أمر الشراء</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 mt-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="text-center pb-3 border-b">
                  <span className="text-sm text-slate-500">رقم الأمر</span>
                  <p className="text-lg font-bold text-orange-600">{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم المادة:</span>
                  <span className="font-semibold">{selectedOrder.material_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الكمية:</span>
                  <span className="font-semibold">{selectedOrder.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المشروع:</span>
                  <span className="font-semibold">{selectedOrder.project_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المورد:</span>
                  <Badge className="bg-green-50 text-green-800 border-green-200 border">
                    {selectedOrder.supplier_name}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مدير المشتريات:</span>
                  <span className="font-semibold">{selectedOrder.manager_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تاريخ الإصدار:</span>
                  <span className="font-semibold">{formatDate(selectedOrder.created_at)}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-slate-500 block mb-1">ملاحظات:</span>
                    <p className="font-medium">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => exportPurchaseOrderToPDF(selectedOrder)}
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير أمر الشراء PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Purchase Order Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">إصدار أمر شراء</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">المادة:</span>
                  <span className="font-semibold">{selectedRequest.material_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الكمية:</span>
                  <span className="font-semibold">{selectedRequest.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">المشروع:</span>
                  <span className="font-semibold">{selectedRequest.project_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">اسم المورد</Label>
                <Input
                  id="supplier"
                  placeholder="مثال: شركة الحديد الوطنية"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="h-11"
                  data-testid="supplier-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                <Textarea
                  id="notes"
                  placeholder="أي ملاحظات إضافية..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  data-testid="order-notes-input"
                />
              </div>

              <Button
                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold"
                onClick={handleCreateOrder}
                disabled={submitting}
                data-testid="confirm-order-btn"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري الإصدار...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>تأكيد أمر الشراء</span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcurementDashboard;
