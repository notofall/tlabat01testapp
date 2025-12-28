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
} from "lucide-react";

const ProcurementDashboard = () => {
  const { user, logout, getAuthHeaders, API_URL } = useAuth();
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
                            إصدار أمر شراء
                          </Button>
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
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Truck className="w-6 h-6 text-green-600" />
            أوامر الشراء المصدرة
          </h2>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

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
