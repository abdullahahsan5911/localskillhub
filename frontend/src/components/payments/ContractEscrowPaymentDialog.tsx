import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/currency";
import api from "@/lib/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface ContractEscrowPaymentDialogProps {
  open: boolean;
  contractId: string | null;
  currency?: string;
  title?: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  onPaid: () => Promise<void> | void;
}

const ContractEscrowPaymentForm = ({
  contractId,
  onSuccess,
}: {
  contractId: string;
  onSuccess: () => Promise<void> | void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (result.error) {
        const message = result.error.message || "Payment failed. Please try again.";
        setErrorMessage(message);
        toast({
          title: "Payment failed",
          description: message,
          variant: "destructive",
        });
        return;
      }

      await api.confirmContractPayment(contractId);
      toast({
        title: "Payment successful",
        description: "Funds are now held in escrow for this contract.",
      });
      await onSuccess();
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      const message = backendMessage || "Payment succeeded but contract sync failed. Please refresh.";
      setErrorMessage(message);
      toast({
        title: "Payment processing issue",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
          defaultValues: {
            billingDetails: {
              name: undefined,
              email: undefined,
              address: {
                country: undefined,
                postal_code: undefined,
                state: undefined,
                city: undefined,
                line1: undefined,
              },
            },
          },
        }}
      />

      {errorMessage && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-sm"
        disabled={submitting || !stripe || !elements}
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Processing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Pay & Sign Contract
          </span>
        )}
      </Button>
    </form>
  );
};

const ContractEscrowPaymentDialog = ({
  open,
  contractId,
  currency,
  title,
  description,
  onOpenChange,
  onPaid,
}: ContractEscrowPaymentDialogProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentQuote, setPaymentQuote] = useState<{
    jobPrice: number;
    processingFee: number;
    clientTotal: number;
    processingFeePercent: number;
  } | null>(null);

  useEffect(() => {
    const fetchClientSecret = async () => {
      if (!open || !contractId) return;

      setPaymentLoading(true);
      setPaymentError(null);
      setClientSecret(null);
      setPaymentQuote(null);

      try {
        const res: any = await api.createContractPaymentIntent(contractId);
        const payload = (res?.data as any) || res;
        setClientSecret(payload.clientSecret as string);

        if (
          typeof payload.jobPrice === "number" &&
          typeof payload.estimatedProcessingFee === "number" &&
          typeof payload.clientTotal === "number"
        ) {
          setPaymentQuote({
            jobPrice: payload.jobPrice,
            processingFee: payload.estimatedProcessingFee,
            clientTotal: payload.clientTotal,
            processingFeePercent:
              typeof payload.processingFeePercent === "number"
                ? payload.processingFeePercent
                : payload.jobPrice > 0
                  ? (payload.estimatedProcessingFee / payload.jobPrice) * 100
                  : 0,
          });
        }
      } catch (err: any) {
        const backendMessage = err?.response?.data?.message;
        setPaymentError(
          backendMessage ||
            "Unable to load payment form. Stripe may not be configured."
        );
      } finally {
        setPaymentLoading(false);
      }
    };

    fetchClientSecret();
  }, [open, contractId]);

  const activeCurrency = useMemo(() => currency, [currency]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setClientSecret(null);
          setPaymentError(null);
          setPaymentQuote(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="mb-1">
          <DialogTitle className="text-base font-bold text-slate-900">
            {title || "Sign Contract & Pay"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {description || "Your payment is held securely in escrow until work is approved."}
          </DialogDescription>
        </DialogHeader>

        {paymentQuote && (
          <div className="rounded-xl bg-slate-900 text-white p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-medium">Total to Pay</span>
              <span className="text-2xl font-bold tabular-nums">
                {formatCurrency(paymentQuote.clientTotal, activeCurrency)}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Job price</span>
                <span className="text-slate-300">
                  {formatCurrency(paymentQuote.jobPrice, activeCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>
                  Card processing fee (~{paymentQuote.processingFeePercent.toFixed(2)}%)
                </span>
                <span className="text-amber-400">
                  +{formatCurrency(paymentQuote.processingFee, activeCurrency)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-700">
              Actual card fees are calculated by Stripe. Small differences do not affect freelancer payout.
            </p>
          </div>
        )}

        {paymentLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading payment form...
          </div>
        )}

        {paymentError && !paymentLoading && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-600">{paymentError}</p>
          </div>
        )}

        {!paymentLoading && !paymentError && clientSecret && contractId && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "flat" } }}>
            <ContractEscrowPaymentForm
              contractId={contractId}
              onSuccess={async () => {
                await onPaid();
                onOpenChange(false);
              }}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContractEscrowPaymentDialog;
