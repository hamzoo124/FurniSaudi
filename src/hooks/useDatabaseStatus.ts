// src/hooks/useDatabaseStatus.ts
import { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { supabase } from '@/lib/supabase';

export const useDatabaseStatus = () => {
  const [tables, setTables] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTables = async () => {
      const tableList = [
        'users',
        'products', 
        'orders',
        'sellers',
        'reviews',
        'advertisements',
        'activity_logs',
        'platform_commissions',
        'wallet_transactions',
        'seller_payouts',
        'contracts'
      ];

      const results: Record<string, boolean> = {};

      for (const table of tableList) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          results[table] = !error;
          console.log(`Table ${table}: ${!error ? '✅' : '❌'}`);
        } catch (err) {
          results[table] = false;
          console.log(`Table ${table}: ❌ (Error)`);
        }
      }

      setTables(results);
      setLoading(false);
    };

    checkTables();
  }, []);

  return { tables, loading };
};