import React, { useState } from 'react';
import { updatePhonePeCollections } from '../../scripts/updatePhonePeCollections';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * A component for admin users to update PhonePe Firebase collections
 */
const PhonePeSetupTool: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const runUpdate = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setLogs(['Starting PhonePe collections update...']);

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

      const result = await updatePhonePeCollections();
      
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;

      if (result) {
        setSuccess(true);
        setLogs(prev => [...prev, 'PhonePe collections updated successfully!']);
      } else {
        setError('Failed to update PhonePe collections. Check console for details.');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      setLogs(prev => [...prev, `ERROR: ${err.message || 'An unknown error occurred'}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PhonePe Firebase Setup</h1>
      
      <p className="mb-4 text-gray-700">
        This tool updates all Firebase collections necessary for PhonePe integration. It will:
      </p>
      
      <ul className="list-disc pl-5 mb-6 space-y-2 text-gray-700">
        <li>Update the <code className="bg-gray-100 px-1 rounded">payment_gateways</code> collection with proper PhonePe configuration</li>
        <li>Fix any structural issues in the <code className="bg-gray-100 px-1 rounded">payment_transactions</code> collection</li>
        <li>Ensure orders are properly linked to payment transactions</li>
      </ul>
      
      <div className="mb-6">
        <Button
          onClick={runUpdate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          {loading ? (
            <span className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 
              Updating Collections...
            </span>
          ) : (
            'Update PhonePe Collections'
          )}
        </Button>
      </div>
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">Update Completed</h3>
            <p className="text-green-700">
              PhonePe collections have been successfully updated. You can now process payments.
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Update Failed</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Update Logs</h3>
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
  );
};

export default PhonePeSetupTool;
