import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  ShieldCheck,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

import { toast } from "sonner";

/* =========================================================
   TYPES
========================================================= */

type Internship = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  duration_days: number;
  certificate_fee_paise: number;
  pass_mark_percent: number;
  is_active: boolean;
};

type ModuleRow = {
  id: string;
  internship_id: string;
  order_index: number;
  title: string;
  description: string;
  content: string;
  quiz_pass_mark_percent?: number | null;
};

type QuizQuestion = {
  id: string;
  internship_id: string;
  module_id: string | null;
  assessment_type: "module" | "final";
  order_index: number;
  question: string;
  options: string[];
  correct_option: number;
};

type Profile = {
  id: string;
  full_name: string;
  phone: string;
  college: string;
  role: "student" | "admin";
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  internship_id: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: string;
  modules_completed: boolean;
  quiz_passed: boolean;
  quiz_percent: number | null;
  payment_verified: boolean;
  profiles?: {
    full_name: string;
    college: string;
    phone: string;
  } | null;
  internships?: {
    title: string;
  } | null;
};

type PaymentRow = {
  id: string;
  enrollment_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount_paise: number;
  currency: string;
  status: string;
  verified_at: string | null;
  created_at: string;
};

type CertificateRow = {
  id: string;
  enrollment_id: string;
  certificate_number: string;
  verification_code: string;
  issue_date: string;
  pdf_path: string | null;
  status: "issued" | "revoked";
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
};

/* =========================================================
   FORM TYPES
========================================================= */

type InternshipFormState = Omit<Internship, "id">;

type ModuleFormState = {
  internship_id: string;
  order_index: number;
  title: string;
  description: string;
  content: string;
};

type QuizFormState = {
  internship_id: string;
  module_id: string;
  assessment_type: "module" | "final";
  order_index: number;
  question: string;
  options: string[];
  correct_option: number;
};

/* =========================================================
   DEFAULT VALUES
========================================================= */

const emptyInternship: InternshipFormState = {
  slug: "",
  title: "",
  short_description: "",
  long_description: "",
  duration_days: 15,
  certificate_fee_paise: 29900,
  pass_mark_percent: 60,
  is_active: true,
};

const emptyModule: ModuleFormState = {
  internship_id: "",
  order_index: 1,
  title: "",
  description: "",
  content: "",
};

const emptyQuiz: QuizFormState = {
  internship_id: "",
  module_id: "",
  assessment_type: "module",
  order_index: 1,
  question: "",
  options: ["", "", "", ""],
  correct_option: 1,
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const AdminInternship = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  /* Filters */

  const [moduleFilter, setModuleFilter] = useState("all");

  /* Quiz manager */

  const [selectedQuizInternship, setSelectedQuizInternship] =
    useState("");

  const [selectedAssessment, setSelectedAssessment] =
    useState<{
      type: "module" | "final";
      moduleId: string | null;
    } | null>(null);

  /* Dialogs */

  const [internshipDialog, setInternshipDialog] =
    useState(false);

  const [editingInternship, setEditingInternship] =
    useState<Internship | null>(null);

  const [internshipForm, setInternshipForm] =
    useState<InternshipFormState>(
      emptyInternship
    );

  const [moduleDialog, setModuleDialog] =
    useState(false);

  const [editingModule, setEditingModule] =
    useState<ModuleRow | null>(null);

  const [moduleForm, setModuleForm] =
    useState<ModuleFormState>(emptyModule);

  const [quizDialog, setQuizDialog] =
    useState(false);

  const [editingQuiz, setEditingQuiz] =
    useState<QuizQuestion | null>(null);

  const [quizForm, setQuizForm] =
    useState<QuizFormState>(emptyQuiz);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const load = async () => {
    setLoading(true);

    const [i, m, q, p, e, pay, c] =
      await Promise.all([
        supabase
          .from("internships")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("modules")
          .select("*")
          .order("internship_id")
          .order("order_index"),

        supabase
          .from("quiz_questions")
          .select("*")
          .order("internship_id")
          .order("assessment_type")
          .order("module_id")
          .order("order_index"),

        supabase
          .from("profiles")
          .select(
            "id, full_name, phone, college, role"
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("enrollments")
          .select(
            `
            id,
            student_id,
            internship_id,
            start_date,
            end_date,
            duration_days,
            status,
            modules_completed,
            quiz_passed,
            quiz_percent,
            payment_verified,
            profiles(full_name, college, phone),
            internships(title)
          `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("payments")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("certificates")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),
      ]);

    const firstError = [
      i,
      m,
      q,
      p,
      e,
      pay,
      c,
    ].find((x) => x.error)?.error;

    if (firstError) {
      toast.error(firstError.message);
    }

    const loadedInternships =
      (i.data as Internship[]) ?? [];

    const loadedModules =
      (m.data as ModuleRow[]) ?? [];

    const loadedQuestions =
      ((q.data as any[]) ?? []).map(
        (row) => ({
          ...row,
          module_id:
            row.module_id ?? null,
          assessment_type:
            row.assessment_type ??
            "module",
          options: Array.isArray(
            row.options
          )
            ? row.options
            : [],
        })
      );

    setInternships(
      loadedInternships
    );

    setModules(
      loadedModules
    );

    setQuestions(
      loadedQuestions
    );

    setProfiles(
      (p.data as Profile[]) ?? []
    );

    setEnrollments(
      (e.data as EnrollmentRow[]) ?? []
    );

    setPayments(
      (pay.data as PaymentRow[]) ?? []
    );

    setCertificates(
      (c.data as CertificateRow[]) ?? []
    );

    /* Automatically select first internship */

    if (
      !selectedQuizInternship &&
      loadedInternships.length > 0
    ) {
      setSelectedQuizInternship(
        loadedInternships[0].id
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(
    () => ({
      students:
        profiles.filter(
          (p) => p.role === "student"
        ).length,

      activeInternships:
        internships.filter(
          (i) => i.is_active
        ).length,

      enrollments:
        enrollments.length,

      pendingPayments:
        payments.filter(
          (p) => p.status !== "verified"
        ).length,

      issuedCertificates:
        certificates.filter(
          (c) => c.status === "issued"
        ).length,

      pendingCertificateEmails:
        certificates.filter(
          (c) =>
            c.status === "issued" &&
            !c.email_sent
        ).length,
    }),
    [
      profiles,
      internships,
      enrollments,
      payments,
      certificates,
    ]
  );

  /* =========================================================
     INTERNSHIP
  ========================================================= */

  const resetInternship = () => {
    setEditingInternship(null);

    setInternshipForm({
      ...emptyInternship,
    });
  };

  const saveInternship = async () => {
    if (
      !internshipForm.slug.trim() ||
      !internshipForm.title.trim()
    ) {
      toast.error(
        "Slug and title are required."
      );
      return;
    }

    setBusy(true);

    const payload = {
      slug: internshipForm.slug
        .trim()
        .toLowerCase(),

      title: internshipForm.title.trim(),

      short_description:
        internshipForm.short_description.trim(),

      long_description:
        internshipForm.long_description.trim(),

      duration_days: Number(
        internshipForm.duration_days
      ),

      certificate_fee_paise:
        Number(
          internshipForm.certificate_fee_paise
        ),

      pass_mark_percent:
        Number(
          internshipForm.pass_mark_percent
        ),

      is_active:
        internshipForm.is_active,
    };

    const result = editingInternship
      ? await supabase
          .from("internships")
          .update(payload)
          .eq(
            "id",
            editingInternship.id
          )
      : await supabase
          .from("internships")
          .insert(payload);

    setBusy(false);

    if (result.error) {
      toast.error(
        result.error.message
      );
      return;
    }

    toast.success(
      editingInternship
        ? "Internship updated."
        : "Internship created."
    );

    setInternshipDialog(false);
    resetInternship();

    await load();
  };

  const toggleInternship = async (
    item: Internship
  ) => {
    const { error } =
      await supabase
        .from("internships")
        .update({
          is_active:
            !item.is_active,
        })
        .eq("id", item.id);

    if (error) {
      toast.error(
        error.message
      );
    } else {
      toast.success(
        item.is_active
          ? "Internship deactivated."
          : "Internship activated."
      );

      await load();
    }
  };

  const deleteInternship = async (
    item: Internship
  ) => {
    if (
      !confirm(
        `Delete "${item.title}"? This also removes its modules and quiz questions.`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("internships")
        .delete()
        .eq("id", item.id);

    if (error) {
      toast.error(
        error.message
      );
    } else {
      toast.success(
        "Internship deleted."
      );

      await load();
    }
  };

  /* =========================================================
     MODULES
  ========================================================= */

  const resetModule = () => {
    setEditingModule(null);

    setModuleForm({
      ...emptyModule,
      internship_id:
        internships[0]?.id ?? "",
    });
  };

  const saveModule = async () => {
    if (
      !moduleForm.internship_id ||
      !moduleForm.title.trim() ||
      !moduleForm.content.trim()
    ) {
      toast.error(
        "Internship, title and content are required."
      );
      return;
    }

    setBusy(true);

    let orderIndex = Number(moduleForm.order_index) || 1;

    /*
     * New modules receive the next available order automatically.
     * Existing modules keep their current order when edited.
     * If an existing module is moved to another internship, it receives
     * the next available number in the new internship automatically.
     */
    const moduleNeedsNewOrder =
      !editingModule ||
      editingModule.internship_id !== moduleForm.internship_id;

    if (moduleNeedsNewOrder) {
      const { data: lastModule, error: orderError } = await supabase
        .from("modules")
        .select("order_index")
        .eq("internship_id", moduleForm.internship_id)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) {
        setBusy(false);
        toast.error(
          `Could not determine the next module number: ${orderError.message}`
        );
        return;
      }

      orderIndex = (lastModule?.order_index ?? 0) + 1;
    }

    const payload = {
      internship_id: moduleForm.internship_id,
      order_index: orderIndex,
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim(),
      content: moduleForm.content.trim(),
    };

    const result = editingModule
      ? await supabase
          .from("modules")
          .update(payload)
          .eq("id", editingModule.id)
      : await supabase
          .from("modules")
          .insert(payload);

    setBusy(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success(
      editingModule
        ? "Module updated."
        : `Module ${orderIndex} created.`
    );

    setModuleDialog(false);
    resetModule();

    await load();
  };

  const deleteModule = async (
    item: ModuleRow
  ) => {
    if (
      !confirm(
        `Delete module "${item.title}"?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("modules")
        .delete()
        .eq("id", item.id);

    if (error) {
      toast.error(
        error.message
      );
    } else {
      toast.success(
        "Module deleted."
      );

      await load();
    }
  };

  /* =========================================================
     QUIZ
  ========================================================= */

  const resetQuiz = (
    assessmentType:
      | "module"
      | "final" = "module",
    moduleId: string | null = null
  ) => {
    setEditingQuiz(null);

    setQuizForm({
      ...emptyQuiz,

      internship_id:
        selectedQuizInternship ||
        internships[0]?.id ||
        "",

      assessment_type:
        assessmentType,

      module_id:
        assessmentType ===
        "module"
          ? moduleId ?? ""
          : "",
    });
  };

  const openAddQuiz = (
    assessmentType:
      | "module"
      | "final",
    moduleId: string | null
  ) => {
    resetQuiz(
      assessmentType,
      moduleId
    );

    setQuizDialog(true);
  };

  const saveQuiz = async () => {
    if (
      !quizForm.internship_id ||
      !quizForm.question.trim() ||
      quizForm.options.some(
        (o) => !o.trim()
      )
    ) {
      toast.error(
        "Internship, question and all four options are required."
      );
      return;
    }

    if (
      quizForm.assessment_type === "module" &&
      !quizForm.module_id
    ) {
      toast.error("Please select a module.");
      return;
    }

    setBusy(true);

    let orderIndex = Number(quizForm.order_index) || 1;

    /*
     * New quiz questions receive the next number automatically.
     * Module quizzes are numbered independently inside each module:
     *   Module 1 -> Q1, Q2, Q3...
     *   Module 2 -> Q1, Q2, Q3...
     *
     * Final assessment questions are numbered independently for the
     * internship: Q1, Q2, Q3...
     *
     * Existing questions keep their current order when edited.
     */
    if (!editingQuiz) {
      const baseOrderQuery = supabase
        .from("quiz_questions")
        .select("order_index")
        .eq("internship_id", quizForm.internship_id)
        .eq("assessment_type", quizForm.assessment_type)
        .order("order_index", { ascending: false })
        .limit(1);

      const orderResult =
        quizForm.assessment_type === "module"
          ? await baseOrderQuery
              .eq("module_id", quizForm.module_id)
              .maybeSingle()
          : await baseOrderQuery
              .is("module_id", null)
              .maybeSingle();

      if (orderResult.error) {
        setBusy(false);
        toast.error(
          `Could not determine the next question number: ${orderResult.error.message}`
        );
        return;
      }

      orderIndex = (orderResult.data?.order_index ?? 0) + 1;
    }

    const payload = {
      internship_id: quizForm.internship_id,
      module_id:
        quizForm.assessment_type === "module"
          ? quizForm.module_id
          : null,
      assessment_type: quizForm.assessment_type,
      order_index: orderIndex,
      question: quizForm.question.trim(),
      options: quizForm.options.map((o) => o.trim()),
      correct_option: Number(quizForm.correct_option),
    };

    const result = editingQuiz
      ? await supabase
          .from("quiz_questions")
          .update(payload)
          .eq("id", editingQuiz.id)
          .select()
          .single()
      : await supabase
          .from("quiz_questions")
          .insert(payload)
          .select()
          .single();

    setBusy(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    const savedQuestion = result.data as QuizQuestion;

    if (editingQuiz) {
      setQuestions((current) =>
        current.map((q) =>
          q.id === editingQuiz.id
            ? {
                ...savedQuestion,
                options: Array.isArray(savedQuestion.options)
                  ? savedQuestion.options
                  : [],
              }
            : q
        )
      );

      toast.success("Quiz question updated.");
    } else {
      setQuestions((current) =>
        [
          ...current,
          {
            ...savedQuestion,
            options: Array.isArray(savedQuestion.options)
              ? savedQuestion.options
              : [],
          },
        ].sort((a, b) => {
          if (a.assessment_type !== b.assessment_type) {
            return a.assessment_type === "module" ? -1 : 1;
          }

          if (a.module_id !== b.module_id) {
            return (a.module_id ?? "").localeCompare(b.module_id ?? "");
          }

          return a.order_index - b.order_index;
        })
      );

      toast.success(`Question ${orderIndex} created.`);
    }

    setQuizDialog(false);
    setEditingQuiz(null);
  };

  const deleteQuiz = async (
    item: QuizQuestion
  ) => {
    if (
      !confirm(
        "Delete this quiz question?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", item.id);

    if (error) {
      toast.error(
        error.message
      );
      return;
    }

    setQuestions((current) =>
      current.filter(
        (q) => q.id !== item.id
      )
    );

    toast.success(
      "Quiz question deleted."
    );
  };

  /* =========================================================
     CERTIFICATES
  ========================================================= */

  const revokeCertificate = async (
    id: string
  ) => {
    if (
      !confirm(
        "Revoke this certificate? Public verification will stop working."
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("certificates")
        .update({
          status: "revoked",
        })
        .eq("id", id);

    if (error) {
      toast.error(
        error.message
      );
    } else {
      toast.success(
        "Certificate revoked."
      );

      await load();
    }
  };

  /* =========================================================
     FILTERED MODULES
  ========================================================= */

  const filteredModules =
    moduleFilter === "all"
      ? modules
      : modules.filter(
          (m) =>
            m.internship_id ===
            moduleFilter
        );

  /* =========================================================
     SELECTED QUIZ QUESTIONS
  ========================================================= */

  const selectedQuizQuestions =
    useMemo(() => {
      if (
        !selectedAssessment ||
        !selectedQuizInternship
      ) {
        return [];
      }

      return questions
        .filter((q) => {
          if (
            q.internship_id !==
            selectedQuizInternship
          ) {
            return false;
          }

          if (
            selectedAssessment.type ===
            "final"
          ) {
            return (
              q.assessment_type ===
              "final"
            );
          }

          return (
            q.assessment_type ===
              "module" &&
            q.module_id ===
              selectedAssessment.moduleId
          );
        })
        .sort(
          (a, b) =>
            a.order_index -
            b.order_index
        );
    }, [
      questions,
      selectedAssessment,
      selectedQuizInternship,
    ]);

  const selectedModule =
    selectedAssessment?.type ===
    "module"
      ? modules.find(
          (m) =>
            m.id ===
            selectedAssessment.moduleId
        )
      : null;

  const selectedInternship =
    internships.find(
      (i) =>
        i.id ===
        selectedQuizInternship
    );

  /* =========================================================
     HELPERS
  ========================================================= */

  const internshipTitle = (
    id: string
  ) =>
    internships.find(
      (i) => i.id === id
    )?.title ??
    "Unknown internship";

  const moduleTitle = (
    id: string | null
  ) =>
    modules.find(
      (m) => m.id === id
    )?.title ??
    "Unassigned";

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="pt-32 text-center text-muted-foreground">
        Loading admin panel…
      </div>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />

            <span className="text-sm text-primary font-medium">
              TechDudes Administration
            </span>
          </div>

          <h1 className="text-3xl font-bold text-foreground">
            Internship Admin Dashboard
          </h1>

          <p className="text-muted-foreground mt-1">
            Manage courses, learning
            content, students, payments
            and certificates.
          </p>
        </div>

                <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={load}
            disabled={busy}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button
            variant="destructive"
            onClick={async () => {
              await logout();
              navigate("/internship", { replace: true });
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard
          label="Students"
          value={stats.students}
        />

        <StatCard
          label="Active Internships"
          value={
            stats.activeInternships
          }
        />

        <StatCard
          label="Enrollments"
          value={
            stats.enrollments
          }
        />

        <StatCard
          label="Pending Payments"
          value={
            stats.pendingPayments
          }
        />

        <StatCard
          label="Certificates"
          value={
            stats.issuedCertificates
          }
        />

        <StatCard
          label="Certificate Emails"
          value={
            stats.pendingCertificateEmails
          }
        />
      </div>

      {/* =====================================================
          TABS
      ===================================================== */}

      <Tabs defaultValue="overview">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>

          <TabsTrigger value="internships">
            Internships (
            {internships.length})
          </TabsTrigger>

          <TabsTrigger value="modules">
            Modules ({modules.length})
          </TabsTrigger>

          <TabsTrigger value="quiz">
            Quiz ({questions.length})
          </TabsTrigger>

          <TabsTrigger value="students">
            Students ({stats.students})
          </TabsTrigger>

          <TabsTrigger value="enrollments">
            Enrollments (
            {enrollments.length})
          </TabsTrigger>

          <TabsTrigger value="payments">
            Payments ({payments.length})
          </TabsTrigger>

          <TabsTrigger value="certificates">
            Certificates (
            {certificates.length})
          </TabsTrigger>
        </TabsList>

        {/* ===================================================
            OVERVIEW
        =================================================== */}

        <TabsContent
          value="overview"
          className="mt-6"
        >
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-glass-border bg-glass/30">
              <CardHeader>
                <CardTitle>
                  System Status
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <StatusRow
                  label="Start-date email automation"
                  value="Daily at 12:05 AM IST"
                />

                <StatusRow
                  label="Certificate automation"
                  value="Daily at 12:05 AM IST"
                />

                <StatusRow
                  label="Payment verification"
                  value="Razorpay + server verification"
                />

                <StatusRow
                  label="Certificate verification"
                  value="Public QR + verification page"
                />

                <StatusRow
                  label="Admin protection"
                  value="AdminRoute + Supabase RLS"
                />

                <StatusRow
                  label="Module quiz pass mark"
                  value="75%"
                />
              </CardContent>
            </Card>

            <Card className="border-glass-border bg-glass/30">
              <CardHeader>
                <CardTitle>
                  What you can manage here
                </CardTitle>
              </CardHeader>

              <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  "Create and edit internship programs",
                  "Activate/deactivate internships",
                  "Create and edit modules",
                  "Create and edit module quizzes",
                  "Create and edit final assessment",
                  "Assign questions to modules",
                  "Manage 75% module pass mark",
                  "Monitor student enrollments",
                  "Monitor Razorpay payments",
                  "View certificate records",
                  "Revoke certificates",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-glass-border p-3"
                  >
                    ✓ {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===================================================
            INTERNSHIPS
        =================================================== */}

        <TabsContent
          value="internships"
          className="mt-6"
        >
          <div className="flex justify-end mb-4">
            <Dialog
              open={internshipDialog}
              onOpenChange={(open) => {
                setInternshipDialog(open);

                if (!open) {
                  resetInternship();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={
                    resetInternship
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Internship
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingInternship
                      ? "Edit Internship"
                      : "Create Internship"}
                  </DialogTitle>
                </DialogHeader>

                <InternshipForm
                  form={
                    internshipForm
                  }
                  setForm={
                    setInternshipForm
                  }
                />

                <Button
                  onClick={
                    saveInternship
                  }
                  disabled={busy}
                >
                  {busy
                    ? "Saving…"
                    : "Save Internship"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-glass-border bg-glass/30">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Title
                    </TableHead>

                    <TableHead>
                      Slug
                    </TableHead>

                    <TableHead>
                      Duration
                    </TableHead>

                    <TableHead>
                      Fee
                    </TableHead>

                    <TableHead>
                      Pass
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>

                    <TableHead>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {internships.map(
                    (i) => (
                      <TableRow
                        key={i.id}
                      >
                        <TableCell className="min-w-[260px] font-medium">
                          {i.title}
                        </TableCell>

                        <TableCell className="font-mono text-xs">
                          {i.slug}
                        </TableCell>

                        <TableCell>
                          {
                            i.duration_days
                          }{" "}
                          days
                        </TableCell>

                        <TableCell>
                          ₹
                          {(
                            i.certificate_fee_paise /
                            100
                          ).toFixed(0)}
                        </TableCell>

                        <TableCell>
                          {
                            i.pass_mark_percent
                          }
                          %
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              i.is_active
                                ? "default"
                                : "secondary"
                            }
                          >
                            {i.is_active
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingInternship(
                                  i
                                );

                                setInternshipForm(
                                  {
                                    ...i,
                                  }
                                );

                                setInternshipDialog(
                                  true
                                );
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                toggleInternship(
                                  i
                                )
                              }
                            >
                              {i.is_active ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteInternship(
                                  i
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================
            MODULES
        =================================================== */}

        <TabsContent
          value="modules"
          className="mt-6"
        >
          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
            <Select
              value={moduleFilter}
              onValueChange={
                setModuleFilter
              }
            >
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Filter internship" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All internships
                </SelectItem>

                {internships.map(
                  (i) => (
                    <SelectItem
                      key={i.id}
                      value={i.id}
                    >
                      {i.title}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Dialog
              open={moduleDialog}
              onOpenChange={(open) => {
                setModuleDialog(
                  open
                );

                if (!open) {
                  resetModule();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={
                    resetModule
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingModule
                      ? "Edit Module"
                      : "Create Module"}
                  </DialogTitle>
                </DialogHeader>

                <ModuleForm
                  form={
                    moduleForm
                  }
                  setForm={
                    setModuleForm
                  }
                  internships={
                    internships
                  }
                />

                <Button
                  onClick={
                    saveModule
                  }
                  disabled={busy}
                >
                  {busy
                    ? "Saving…"
                    : "Save Module"}
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-glass-border bg-glass/30">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      #
                    </TableHead>

                    <TableHead>
                      Internship
                    </TableHead>

                    <TableHead>
                      Title
                    </TableHead>

                    <TableHead>
                      Description
                    </TableHead>

                    <TableHead>
                      Quiz Pass
                    </TableHead>

                    <TableHead>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredModules.map(
                    (m) => (
                      <TableRow
                        key={m.id}
                      >
                        <TableCell>
                          {
                            m.order_index
                          }
                        </TableCell>

                        <TableCell className="min-w-[220px]">
                          {internshipTitle(
                            m.internship_id
                          )}
                        </TableCell>

                        <TableCell className="font-medium min-w-[220px]">
                          {m.title}
                        </TableCell>

                        <TableCell className="max-w-[360px] truncate">
                          {
                            m.description
                          }
                        </TableCell>

                        <TableCell>
                          {m.quiz_pass_mark_percent ??
                            75}
                          %
                        </TableCell>

                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingModule(
                                  m
                                );

                                setModuleForm(
                                  {
                                    internship_id:
                                      m.internship_id,
                                    order_index:
                                      m.order_index,
                                    title:
                                      m.title,
                                    description:
                                      m.description,
                                    content:
                                      m.content,
                                  }
                                );

                                setModuleDialog(
                                  true
                                );
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                deleteModule(
                                  m
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================================================
            QUIZ MANAGEMENT
        =================================================== */}

        <TabsContent
          value="quiz"
          className="mt-6"
        >
          {!selectedAssessment ? (
            <>
              {/* INTERNSHIP SELECTOR */}

              <Card className="border-glass-border bg-glass/30 mb-6">
                <CardHeader>
                  <CardTitle>
                    Quiz Management
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <Field label="Select Internship">
                    <Select
                      value={
                        selectedQuizInternship
                      }
                      onValueChange={(
                        value
                      ) => {
                        setSelectedQuizInternship(
                          value
                        );

                        setSelectedAssessment(
                          null
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select internship" />
                      </SelectTrigger>

                      <SelectContent>
                        {internships.map(
                          (i) => (
                            <SelectItem
                              key={i.id}
                              value={i.id}
                            >
                              {i.title}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                </CardContent>
              </Card>

              {selectedQuizInternship && (
                <div className="space-y-6">
                  {/* MODULE QUIZZES */}

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ClipboardList className="h-5 w-5 text-primary" />

                      <h2 className="text-xl font-semibold">
                        Module Quizzes
                      </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {modules
                        .filter(
                          (m) =>
                            m.internship_id ===
                            selectedQuizInternship
                        )
                        .sort(
                          (a, b) =>
                            a.order_index -
                            b.order_index
                        )
                        .map(
                          (module) => {
                            const count =
                              questions.filter(
                                (q) =>
                                  q.internship_id ===
                                    selectedQuizInternship &&
                                  q.assessment_type ===
                                    "module" &&
                                  q.module_id ===
                                    module.id
                              ).length;

                            return (
                              <Card
                                key={
                                  module.id
                                }
                                className="border-glass-border bg-glass/30"
                              >
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="text-xs text-primary font-medium mb-1">
                                        MODULE{" "}
                                        {
                                          module.order_index
                                        }
                                      </div>

                                      <h3 className="font-semibold text-lg">
                                        {
                                          module.title
                                        }
                                      </h3>

                                      <p className="text-sm text-muted-foreground mt-2">
                                        {
                                          count
                                        }{" "}
                                        question
                                        {count !==
                                        1
                                          ? "s"
                                          : ""}
                                      </p>

                                      <div className="text-xs text-muted-foreground mt-1">
                                        Pass mark:
                                        75%
                                      </div>
                                    </div>

                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAssessment(
                                          {
                                            type: "module",
                                            moduleId:
                                              module.id,
                                          }
                                        );
                                      }}
                                    >
                                      Manage
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          }
                        )}
                    </div>
                  </div>

                  {/* FINAL ASSESSMENT */}

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ClipboardList className="h-5 w-5 text-primary" />

                      <h2 className="text-xl font-semibold">
                        Final Assessment
                      </h2>
                    </div>

                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">
                              Final Assessment
                            </h3>

                            <p className="text-sm text-muted-foreground mt-1">
                              Questions for the
                              final internship
                              assessment.
                            </p>

                            <p className="text-sm text-muted-foreground mt-1">
                              {
                                questions.filter(
                                  (q) =>
                                    q.internship_id ===
                                      selectedQuizInternship &&
                                    q.assessment_type ===
                                      "final"
                                ).length
                              }{" "}
                              questions
                            </p>
                          </div>

                          <Button
                            onClick={() =>
                              setSelectedAssessment(
                                {
                                  type: "final",
                                  moduleId:
                                    null,
                                }
                              )
                            }
                          >
                            Manage Final Assessment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* =================================================
                  QUESTION MANAGER
              ================================================= */}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setSelectedAssessment(
                        null
                      )
                    }
                    className="px-0 mb-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Quiz Manager
                  </Button>

                  <h2 className="text-2xl font-bold">
                    {selectedAssessment.type ===
                    "final"
                      ? "Final Assessment"
                      : selectedModule?.title ??
                        "Module Quiz"}
                  </h2>

                  <p className="text-sm text-muted-foreground mt-1">
                    {
                      selectedInternship?.title
                    }
                  </p>
                </div>

                <Button
                  onClick={() =>
                    openAddQuiz(
                      selectedAssessment.type,
                      selectedAssessment.moduleId
                    )
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {/* QUESTION COUNT */}

              <div className="mb-4">
                <Badge variant="secondary">
                  {
                    selectedQuizQuestions.length
                  }{" "}
                  question
                  {selectedQuizQuestions.length !==
                  1
                    ? "s"
                    : ""}
                </Badge>

                {selectedAssessment.type ===
                  "module" && (
                  <Badge
                    variant="outline"
                    className="ml-2"
                  >
                    Pass Mark: 75%
                  </Badge>
                )}
              </div>

              {/* QUESTION TABLE */}

              <Card className="border-glass-border bg-glass/30">
                <CardContent className="p-0 overflow-x-auto">
                  {selectedQuizQuestions.length ===
                  0 ? (
                    <div className="p-10 text-center">
                      <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-3" />

                      <h3 className="font-semibold">
                        No questions yet
                      </h3>

                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Add the first question
                        for this assessment.
                      </p>

                      <Button
                        onClick={() =>
                          openAddQuiz(
                            selectedAssessment.type,
                            selectedAssessment.moduleId
                          )
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            #
                          </TableHead>

                          <TableHead>
                            Question
                          </TableHead>

                          <TableHead>
                            Correct answer
                          </TableHead>

                          <TableHead>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {selectedQuizQuestions.map(
                          (q) => (
                            <TableRow
                              key={
                                q.id
                              }
                            >
                              <TableCell>
                                {
                                  q.order_index
                                }
                              </TableCell>

                              <TableCell className="min-w-[400px]">
                                {
                                  q.question
                                }
                              </TableCell>

                              <TableCell className="min-w-[180px]">
                                {
                                  q.options[
                                    q.correct_option - 1
                                  ] ??
                                  "—"
                                }
                              </TableCell>

                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingQuiz(
                                        q
                                      );

                                      setQuizForm(
                                        {
                                          internship_id:
                                            q.internship_id,

                                          module_id:
                                            q.module_id ??
                                            "",

                                          assessment_type:
                                            q.assessment_type,

                                          order_index:
                                            q.order_index,

                                          question:
                                            q.question,

                                          options:
                                            [
                                              ...q.options,
                                            ],

                                          correct_option:
                                            q.correct_option,
                                        }
                                      );

                                      setQuizDialog(
                                        true
                                      );
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      deleteQuiz(
                                        q
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* =================================================
              QUIZ DIALOG
          ================================================= */}

          <Dialog
            open={quizDialog}
            onOpenChange={(open) => {
              setQuizDialog(
                open
              );

              if (!open) {
                setEditingQuiz(
                  null
                );
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuiz
                    ? "Edit Quiz Question"
                    : quizForm.assessment_type ===
                      "final"
                    ? "Create Final Assessment Question"
                    : "Create Module Quiz Question"}
                </DialogTitle>
              </DialogHeader>

              <QuizForm
                form={quizForm}
                setForm={setQuizForm}
                internships={internships}
                modules={modules}
              />

              <Button
                onClick={saveQuiz}
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : editingQuiz
                  ? "Update Question"
                  : "Save Question"}
              </Button>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===================================================
            STUDENTS
        =================================================== */}

        <TabsContent
          value="students"
          className="mt-6"
        >
          <DataCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Name
                  </TableHead>

                  <TableHead>
                    Phone
                  </TableHead>

                  <TableHead>
                    College
                  </TableHead>

                  <TableHead>
                    Role
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {profiles.map(
                  (p) => (
                    <TableRow
                      key={p.id}
                    >
                      <TableCell className="font-medium">
                        {
                          p.full_name
                        }
                      </TableCell>

                      <TableCell>
                        {p.phone}
                      </TableCell>

                      <TableCell>
                        {
                          p.college
                        }
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            p.role ===
                            "admin"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {p.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </DataCard>
        </TabsContent>

        {/* ===================================================
            ENROLLMENTS
        =================================================== */}

        <TabsContent
          value="enrollments"
          className="mt-6"
        >
          <DataCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Student
                  </TableHead>

                  <TableHead>
                    Internship
                  </TableHead>

                  <TableHead>
                    Dates
                  </TableHead>

                  <TableHead>
                    Modules
                  </TableHead>

                  <TableHead>
                    Quiz
                  </TableHead>

                  <TableHead>
                    Payment
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {enrollments.map(
                  (e) => (
                    <TableRow
                      key={e.id}
                    >
                      <TableCell className="min-w-[180px]">
                        {
                          e.profiles
                            ?.full_name ??
                          "—"
                        }

                        <div className="text-xs text-muted-foreground">
                          {
                            e.profiles
                              ?.college
                          }
                        </div>
                      </TableCell>

                      <TableCell className="min-w-[230px]">
                        {
                          e.internships
                            ?.title ??
                          "—"
                        }
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {
                          e.start_date
                        }
                        <br />
                        →{" "}
                        {
                          e.end_date
                        }
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            e.modules_completed
                              ? "default"
                              : "secondary"
                          }
                        >
                          {e.modules_completed
                            ? "100%"
                            : "In progress"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {e.quiz_passed
                          ? `Passed ${
                              e.quiz_percent ??
                              ""
                            }%`
                          : "Pending"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            e.payment_verified
                              ? "default"
                              : "secondary"
                          }
                        >
                          {e.payment_verified
                            ? "Verified"
                            : "Pending"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {e.status}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </DataCard>
        </TabsContent>

        {/* ===================================================
            PAYMENTS
        =================================================== */}

        <TabsContent
          value="payments"
          className="mt-6"
        >
          <DataCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Order ID
                  </TableHead>

                  <TableHead>
                    Payment ID
                  </TableHead>

                  <TableHead>
                    Amount
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Verified At
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {payments.map(
                  (p) => (
                    <TableRow
                      key={p.id}
                    >
                      <TableCell className="font-mono text-xs">
                        {
                          p.razorpay_order_id
                        }
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {
                          p.razorpay_payment_id ??
                          "—"
                        }
                      </TableCell>

                      <TableCell>
                        ₹
                        {(
                          p.amount_paise /
                          100
                        ).toFixed(0)}
                      </TableCell>

                      <TableCell>
                        {
                          p.status
                        }
                      </TableCell>

                      <TableCell>
                        {
                          p.verified_at ??
                          "—"
                        }
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </DataCard>
        </TabsContent>

        {/* ===================================================
            CERTIFICATES
        =================================================== */}

        <TabsContent
          value="certificates"
          className="mt-6"
        >
          <DataCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Certificate #
                  </TableHead>

                  <TableHead>
                    Verification Code
                  </TableHead>

                  <TableHead>
                    Issue Date
                  </TableHead>

                  <TableHead>
                    Email
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {certificates.map(
                  (c) => (
                    <TableRow
                      key={c.id}
                    >
                      <TableCell className="font-medium">
                        {
                          c.certificate_number
                        }
                      </TableCell>

                      <TableCell className="font-mono text-xs">
                        {
                          c.verification_code
                        }
                      </TableCell>

                      <TableCell>
                        {
                          c.issue_date
                        }
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            c.email_sent
                              ? "default"
                              : "secondary"
                          }
                        >
                          {c.email_sent
                            ? "Sent"
                            : "Pending"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {c.status}
                      </TableCell>

                      <TableCell>
                        {c.status ===
                          "issued" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              revokeCertificate(
                                c.id
                              )
                            }
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </DataCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: number;
}) => (
  <Card className="border-glass-border bg-glass/30">
    <CardContent className="p-4">
      <div className="text-2xl font-bold">
        {value}
      </div>

      <div className="text-xs text-muted-foreground mt-1">
        {label}
      </div>
    </CardContent>
  </Card>
);

/* =========================================================
   STATUS ROW
========================================================= */

const StatusRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex justify-between gap-4 border-b border-glass-border pb-2">
    <span>{label}</span>

    <span className="text-muted-foreground text-right">
      {value}
    </span>
  </div>
);

/* =========================================================
   DATA CARD
========================================================= */

const DataCard = ({
  children,
}: {
  children: ReactNode;
}) => (
  <Card className="border-glass-border bg-glass/30">
    <CardContent className="p-0 overflow-x-auto">
      {children}
    </CardContent>
  </Card>
);

/* =========================================================
   INTERNSHIP FORM
========================================================= */

const InternshipForm = ({
  form,
  setForm,
}: {
  form: InternshipFormState;
  setForm: Dispatch<
    SetStateAction<InternshipFormState>
  >;
}) => (
  <div className="grid gap-4">
    <Field label="Slug">
      <Input
        value={form.slug}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            slug: e.target.value,
          }))
        }
        placeholder="web-development"
      />
    </Field>

    <Field label="Title">
      <Input
        value={form.title}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            title: e.target.value,
          }))
        }
      />
    </Field>

    <Field label="Short description">
      <Textarea
        value={
          form.short_description
        }
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            short_description:
              e.target.value,
          }))
        }
      />
    </Field>

    <Field label="Long description">
      <Textarea
        className="min-h-28"
        value={
          form.long_description
        }
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            long_description:
              e.target.value,
          }))
        }
      />
    </Field>

    <div className="grid sm:grid-cols-3 gap-4">
      <Field label="Duration (days)">
        <Input
          type="number"
          min="1"
          value={
            form.duration_days
          }
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              duration_days:
                Number(
                  e.target.value
                ),
            }))
          }
        />
      </Field>

      <Field label="Certificate fee (paise)">
        <Input
          type="number"
          min="0"
          value={
            form.certificate_fee_paise
          }
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              certificate_fee_paise:
                Number(
                  e.target.value
                ),
            }))
          }
        />
      </Field>

      <Field label="Pass mark (%)">
        <Input
          type="number"
          min="1"
          max="100"
          value={
            form.pass_mark_percent
          }
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              pass_mark_percent:
                Number(
                  e.target.value
                ),
            }))
          }
        />
      </Field>
    </div>

    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={form.is_active}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            is_active:
              e.target.checked,
          }))
        }
      />

      Active internship
    </label>
  </div>
);

/* =========================================================
   MODULE FORM
========================================================= */

const ModuleForm = ({
  form,
  setForm,
  internships,
}: {
  form: ModuleFormState;
  setForm: Dispatch<
    SetStateAction<ModuleFormState>
  >;
  internships: Internship[];
}) => (
  <div className="grid gap-4">
    <Field label="Internship">
      <Select
        value={
          form.internship_id
        }
        onValueChange={(v) =>
          setForm((f) => ({
            ...f,
            internship_id: v,
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select internship" />
        </SelectTrigger>

        <SelectContent>
          {internships.map(
            (i) => (
              <SelectItem
                key={i.id}
                value={i.id}
              >
                {i.title}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </Field>

    <div className="grid sm:grid-cols-2 gap-4">
      <div className="rounded-lg border border-glass-border bg-muted/20 p-3">
        <div className="text-sm font-medium">Module Number</div>
        <div className="text-sm text-muted-foreground mt-1">
          {form.order_index || 1} — assigned automatically
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          New modules use the next available number.
        </div>
      </div>

      <Field label="Title">
        <Input
          value={form.title}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              title: e.target.value,
            }))
          }
        />
      </Field>
    </div>

    <Field label="Description">
      <Textarea
        value={
          form.description
        }
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            description:
              e.target.value,
          }))
        }
      />
    </Field>

    <Field label="Content">
      <Textarea
        className="min-h-64"
        value={form.content}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            content:
              e.target.value,
          }))
        }
      />
    </Field>

    <div className="rounded-lg border border-glass-border p-3 text-sm text-muted-foreground">
      Module quiz pass mark:{" "}
      <span className="font-semibold text-foreground">
        75%
      </span>
    </div>
  </div>
);

/* =========================================================
   QUIZ FORM
========================================================= */

const QuizForm = ({
  form,
  setForm,
  internships,
  modules,
}: {
  form: QuizFormState;
  setForm: Dispatch<
    SetStateAction<QuizFormState>
  >;
  internships: Internship[];
  modules: ModuleRow[];
}) => {
  const availableModules =
    modules.filter(
      (m) =>
        m.internship_id ===
        form.internship_id
    );

  return (
    <div className="grid gap-4">
      {/* ASSESSMENT TYPE */}

      <Field label="Assessment Type">
        <Select
          value={
            form.assessment_type
          }
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              assessment_type:
                v as
                  | "module"
                  | "final",

              module_id:
                v === "final"
                  ? ""
                  : f.module_id,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="module">
              Module Quiz
            </SelectItem>

            <SelectItem value="final">
              Final Assessment
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {/* INTERNSHIP */}

      <Field label="Internship">
        <Select
          value={
            form.internship_id
          }
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              internship_id: v,
              module_id: "",
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select internship" />
          </SelectTrigger>

          <SelectContent>
            {internships.map(
              (i) => (
                <SelectItem
                  key={i.id}
                  value={i.id}
                >
                  {i.title}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </Field>

      {/* MODULE */}

      {form.assessment_type ===
        "module" && (
        <Field label="Module">
          <Select
            value={
              form.module_id
            }
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                module_id: v,
              }))
            }
            disabled={
              !form.internship_id
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  form.internship_id
                    ? "Select module"
                    : "Select internship first"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {availableModules
                .sort(
                  (a, b) =>
                    a.order_index -
                    b.order_index
                )
                .map(
                  (m) => (
                    <SelectItem
                      key={m.id}
                      value={m.id}
                    >
                      {
                        m.order_index
                      }
                      .{" "}
                      {m.title}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
        </Field>
      )}

      {/* AUTOMATIC ORDER + CORRECT OPTION */}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-lg border border-glass-border bg-muted/20 p-3">
          <div className="text-sm font-medium">Question Number</div>
          <div className="text-sm text-muted-foreground mt-1">
            {form.order_index || 1} — assigned automatically
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            New questions use the next available number for this module.
          </div>
        </div>

        <Field label="Correct option">
          <Select
            value={String(form.correct_option)}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                correct_option: Number(v),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select correct option" />
            </SelectTrigger>

            <SelectContent>
              {[1, 2, 3, 4].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Option {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      {/* QUESTION */}

      <Field label="Question">
        <Textarea
          value={
            form.question
          }
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              question:
                e.target.value,
            }))
          }
          placeholder="Enter the question..."
        />
      </Field>

      {/* OPTIONS */}

      {form.options.map(
        (option, index) => (
          <Field
            key={index}
            label={`Option ${
              index + 1
            }`}
          >
            <Input
              value={option}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  options:
                    f.options.map(
                      (o, i) =>
                        i ===
                        index
                          ? e
                              .target
                              .value
                          : o
                    ),
                }))
              }
              placeholder={`Enter option ${
                index + 1
              }`}
            />
          </Field>
        )
      )}

      {/* INFO */}

      <div className="rounded-lg border border-glass-border bg-muted/20 p-3 text-sm">
        {form.assessment_type ===
        "module" ? (
          <>
            <div className="font-medium mb-1">
              Module Quiz
            </div>

            <div className="text-muted-foreground">
              Each module should
              contain 3–5
              questions. Students
              must score at least{" "}
              <span className="font-semibold text-foreground">
                75%
              </span>{" "}
              to pass the module.
            </div>
          </>
        ) : (
          <>
            <div className="font-medium mb-1">
              Final Assessment
            </div>

            <div className="text-muted-foreground">
              These questions belong
              to the final assessment
              for the selected
              internship.
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   FIELD
========================================================= */

const Field = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="grid gap-1.5">
    <Label>{label}</Label>

    {children}
  </div>
);

/* =========================================================
   EXPORT
========================================================= */

export default AdminInternship;