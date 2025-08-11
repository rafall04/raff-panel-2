"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { submitReport } from './actions';
import { Send, LoaderCircle } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn bg-primary text-white border-none hover:bg-violet-700 w-full" aria-disabled={pending}>
      {pending ? <LoaderCircle className="animate-spin" /> : <Send className="mr-2" />}
      {pending ? 'Sending...' : 'Send Report'}
    </button>
  );
}

export default function ReportForm() {
  const [state, formAction] = useFormState(submitReport, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="form-control">
        <label htmlFor="category" className="label">
          <span className="label-text text-gray-300">Issue Category</span>
        </label>
        <select
          id="category"
          name="category"
          required
          className="select select-bordered w-full text-white bg-black/20 focus:bg-black/30 focus:border-primary"
        >
          <option>Slow Connection</option>
          <option>No Connection</option>
          <option>Other</option>
        </select>
      </div>
      <div className="form-control">
        <label htmlFor="description" className="label">
          <span className="label-text text-gray-300">Description</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          className="textarea textarea-bordered h-24 w-full text-white bg-black/20 focus:bg-black/30 focus:border-primary"
          placeholder="Please describe the issue in detail."
        ></textarea>
      </div>
      <div className="form-control mt-6">
        <SubmitButton />
      </div>
      {state?.message && (
        <p className={`mt-2 text-sm ${state.success ? 'text-green-400' : 'text-red-400'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
