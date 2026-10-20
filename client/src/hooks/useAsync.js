import { useCallback, useEffect, useState } from 'react';
export default function useAsync(load, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await load()); }
    catch (caught) { setError(caught); }
    finally { setLoading(false); }
  }, dependencies);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}
