import React, { useState } from 'react';
import { runPhonePeSetup } from './setupPhonePeIntegration';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Component for running the PhonePe setup process
 * Can be used in admin panel to fix PhonePe integration issues
 */
const RunPhonePeSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const handleSetup = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setLogs(['Starting PhonePe integration setup...']);

    try {
      // Override console.log to capture logs
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;

      console.log = (message: any, ...args: any[]) => {
        originalConsoleLog(message, ...args);
        setLogs(prev => [...prev, typeof message === 'string' ? message : JSON.stringify(message)]);
      };

      console.error = (message: any, ...args: any[]) => {
        originalConsoleError(message, ...args);
        setLogs(prev => [...prev, `ERROR: ${typeof message === 'string' ? message : JSON.stringify(message)}`]);
      };

      await runPhonePeSetup();
      
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;

      setSuccess(true);
      setLogs(prev => [...prev, 'PhonePe integration setup completed successfully!']);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      setLogs(prev => [...prev, `ERROR: ${err.message || 'An unknown error occurred'}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">PhonePe Integration Setup</h1>
        
        <p className="mb-4 text-gray-700">
          This utility will fix your PhonePe integration by setting up the required Firebase Firestore 
          collections with proper structure and sample data. It will:
        </p>
        
        <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-700">
          <li>Create/update PhonePe payment gateway configurations in Firestore</li>
          <li>Set up proper structure for payment transactions</li>
          <li>Create sample transaction data with correct field types</li>
          <li>Fix the "undefined field value" errors in your database</li>
        </ul>
        
        <div className="mb-6">
          <Button
            onClick={handleSetup}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                Running Setup...
              </span>
            ) : (
              'Run PhonePe Setup'
            )}
          </Button>
        </div>
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 flex items-start">
            <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">Setup Completed</h3>
              <p className="text-green-700">
                PhonePe integration has been successfully set up. You can now use PhonePe for payments.
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Setup Failed</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Setup Logs</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md max-h-80 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className={`${log.startsWith('ERROR') ? 'text-red-400' : 'text-green-400'}`}>
                  &gt; {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RunPhonePeSetup;
