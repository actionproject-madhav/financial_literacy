import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '../social/Modal';
import { paymentApi, learnerApi } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { useToast } from '../ui/Toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId: string;
  packageName: string;
  coins: number;
  priceCents: number;
  packageType: 'coins' | 'powerup';
}

const PaymentForm: React.FC<{
  packageId: string;
  packageName: string;
  coins: number;
  priceCents: number;
  packageType: 'coins' | 'powerup';
  onSuccess: () => void;
  onClose: () => void;
}> = ({ packageId, packageName, coins, priceCents, packageType, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { learnerId, setUser, user } = useUserStore();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!learnerId || !stripe) return;

    const createIntent = async () => {
      try {
        const result = await paymentApi.createPaymentIntent(learnerId, packageId, packageType);
        setClientSecret(result.client_secret);
      } catch (err: any) {
        setError(err?.message || 'Failed to initialize payment');
        toast.error('Failed to initialize payment');
      }
    };

    createIntent();
  }, [learnerId, packageId, packageType, stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret || !learnerId) return;

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        toast.error(stripeError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Call backend to award coins
        const result = await paymentApi.handlePaymentSuccess(learnerId, paymentIntent.id);

        if (result.success) {
          // Update user gems
          if (user) {
            setUser({
              ...user,
              gems: result.total_gems,
            });
          }

          toast.success(`Success! ${coins} coins added to your account.`);
          onSuccess();
          onClose();
        } else {
          throw new Error('Failed to process payment');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Payment failed');
      toast.error(err?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#3c3c3c',
        '::placeholder': {
          color: '#afafaf',
        },
      },
      invalid: {
        color: '#ff4b4b',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-2 border-[#e5e5e5] rounded-xl p-4">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="text-[#ff4b4b] text-sm font-bold">{error}</div>
      )}

      <div className="flex items-center justify-between p-4 bg-[#f5f5f5] rounded-xl">
        <div>
          <div className="font-bold text-[#3c3c3c]">{packageName}</div>
          <div className="text-sm text-[#afafaf]">{coins} coins</div>
        </div>
        <div className="text-xl font-bold text-[#3c3c3c]">
          ${(priceCents / 100).toFixed(2)}
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className="w-full bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${(priceCents / 100).toFixed(2)}`
        )}
      </button>
    </form>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  packageId,
  packageName,
  coins,
  priceCents,
  packageType,
}) => {
  const [success, setSuccess] = useState(false);

  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
    },
  };

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 2000);
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Payment Successful" maxWidth="md">
        <div className="p-6 text-center">
          <CheckCircle2 className="w-16 h-16 text-[#58cc02] mx-auto mb-4" />
          <div className="text-xl font-bold text-[#3c3c3c] mb-2">Payment Successful!</div>
          <div className="text-[#afafaf]">{coins} coins have been added to your account.</div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase Coins" maxWidth="md">
      <div className="p-4">
        {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm
              packageId={packageId}
              packageName={packageName}
              coins={coins}
              priceCents={priceCents}
              packageType={packageType}
              onSuccess={handleSuccess}
              onClose={onClose}
            />
          </Elements>
        ) : (
          <div className="text-center py-8">
            <div className="text-[#ff4b4b] font-bold">Stripe not configured</div>
            <div className="text-sm text-[#afafaf] mt-2">
              Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

