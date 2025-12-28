import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  XCircle,
  RefreshCw,
  FileText,
  Check,
  X,
  Eye,
  Download,
} from "lucide-react";
import { exportRequestToPDF, exportRequestsTableToPDF } from "../utils/pdfExport";

const EngineerDashboard = () => {
  const { user, logout, getAuthHeaders, API_URL } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/requests`, getAuthHeaders()),
        axios.get(`${API_URL}/dashboard/stats`, getAuthHeaders()),
      ]);
      setRequests(requestsRes.data);
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

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/requests/${requestId}/approve`, {}, getAuthHeaders());
      toast.success("تم اعتماد الطلب بنجاح");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في اعتماد الطلب");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("الرجاء إدخال سبب الرفض");
      return;
    }

    setActionLoading(true);
    try {
      await axios.put(
        `${API_URL}/requests/${selectedRequest.id}/reject`,
        { reason: rejectionReason },
        getAuthHeaders()
      );
      toast.success("تم رفض الطلب");
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في رفض الطلب");
    } finally {
      setActionLoading(false);
    }
  };

  const openViewDialog = (request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending_engineer: { label: "بانتظار الاعتماد", variant: "warning", icon: Clock },
      approved_by_engineer: { label: "معتمد", variant: "success", icon: CheckCircle },
      rejected_by_engineer: { label: "مرفوض", variant: "destructive", icon: XCircle },
      purchase_order_issued: { label: "تم إصدار أمر الشراء", variant: "default", icon: FileText },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "secondary", icon: Clock };
    const Icon = statusInfo.icon;

    const variantClasses = {
      warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
      success: "bg-green-50 text-green-800 border-green-200",
      destructive: "bg-red-50 text-red-800 border-red-200",
      default: "bg-blue-50 text-blue-800 border-blue-200",
      secondary: "bg-slate-50 text-slate-800 border-slate-200",
    };

    return (
      <Badge className={`${variantClasses[statusInfo.variant]} border flex items-center gap-1 font-medium`}>
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
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

  const pendingRequests = requests.filter((r) => r.status === "pending_engineer");
  const processedRequests = requests.filter((r) => r.status !== "pending_engineer");

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
                <p className="text-sm text-slate-400">لوحة تحكم المهندس</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-r-4 border-r-orange-500 hover-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">إجمالي الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-yellow-500 hover-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">بانتظار الاعتماد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-r-4 border-r-green-500 hover-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">معتمدة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.approved || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              طلبات تحتاج اعتمادك
              {pendingRequests.length > 0 && (
                <span className="bg-yellow-500 text-white text-sm px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </h2>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => exportRequestsTableToPDF(requests, 'طلبات المهندس')}
                className="border-slate-300"
                disabled={requests.length === 0}
                data-testid="export-all-pdf-btn"
              >
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
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
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد طلبات معلقة</h3>
                  <p className="text-slate-500">جميع الطلبات تم مراجعتها</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right font-bold">اسم المادة</TableHead>
                      <TableHead className="text-right font-bold">الكمية</TableHead>
                      <TableHead className="text-right font-bold">المشروع</TableHead>
                      <TableHead className="text-right font-bold">المشرف</TableHead>
                      <TableHead className="text-right font-bold">السبب</TableHead>
                      <TableHead className="text-right font-bold">التاريخ</TableHead>
                      <TableHead className="text-right font-bold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id} className="table-row-hover" data-testid={`pending-request-${request.id}`}>
                        <TableCell className="font-medium">{request.material_name}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>{request.project_name}</TableCell>
                        <TableCell>{request.supervisor_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openViewDialog(request)}
                              className="h-8 w-8 p-0"
                              data-testid={`view-btn-${request.id}`}
                            >
                              <Eye className="w-4 h-4 text-slate-600" />
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApprove(request.id)}
                              disabled={actionLoading}
                              data-testid={`approve-btn-${request.id}`}
                            >
                              <Check className="w-4 h-4 ml-1" />
                              اعتماد
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request);
                                setRejectDialogOpen(true);
                              }}
                              disabled={actionLoading}
                              data-testid={`reject-btn-${request.id}`}
                            >
                              <X className="w-4 h-4 ml-1" />
                              رفض
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

        {/* Processed Requests */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">الطلبات السابقة</h2>
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {processedRequests.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">لا توجد طلبات سابقة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-right font-bold">اسم المادة</TableHead>
                      <TableHead className="text-right font-bold">الكمية</TableHead>
                      <TableHead className="text-right font-bold">المشروع</TableHead>
                      <TableHead className="text-right font-bold">المشرف</TableHead>
                      <TableHead className="text-right font-bold">الحالة</TableHead>
                      <TableHead className="text-right font-bold">التاريخ</TableHead>
                      <TableHead className="text-right font-bold">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedRequests.map((request) => (
                      <TableRow key={request.id} className="table-row-hover" data-testid={`processed-request-${request.id}`}>
                        <TableCell className="font-medium">{request.material_name}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>{request.project_name}</TableCell>
                        <TableCell>{request.supervisor_name}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {formatDate(request.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openViewDialog(request)}
                              className="h-8 w-8 p-0"
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
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
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
                {selectedRequest.rejection_reason && (
                  <div className="pt-2 border-t bg-red-50 p-3 rounded">
                    <span className="text-red-600 block mb-1">سبب الرفض:</span>
                    <p className="font-medium text-red-800">{selectedRequest.rejection_reason}</p>
                  </div>
                )}
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">رفض الطلب</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 mb-4">
              هل أنت متأكد من رفض طلب <strong>{selectedRequest?.material_name}</strong>؟
            </p>
            <Textarea
              placeholder="اذكر سبب الرفض..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              data-testid="rejection-reason-input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading}
              data-testid="confirm-reject-btn"
            >
              {actionLoading ? "جاري الرفض..." : "تأكيد الرفض"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EngineerDashboard;
