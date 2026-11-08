import { useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully');
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20">
      <h2 className="text-xl font-semibold">Set New Password</h2>
      <input
        type="password"
        placeholder="New Password"
        className="border p-2 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={updatePassword}
        className="bg-primary text-white p-2 rounded"
      >
        Update Password
      </button>
    </div>
  );
}