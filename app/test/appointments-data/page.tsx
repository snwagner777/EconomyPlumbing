'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Download } from 'lucide-react';

export default function AppointmentsDataTest() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointmentsData();
  }, []);

  const fetchAppointmentsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/customer-portal/appointments', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setData(data);

      // Also log to console
      console.log('Fetched appointments data:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }
  };

  const downloadJson = () => {
    if (data) {
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`);
      element.setAttribute('download', 'appointments-data.json');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Loading appointment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={fetchAppointmentsData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <p>No data</p>
      </div>
    );
  }

  const jobCount = data.data?.length || 0;
  const jobs = data.data || [];
  
  // Extract field names
  const jobFields = jobs.length > 0 ? Object.keys(jobs[0]).sort() : [];
  const appointmentFields = jobs.length > 0 && jobs[0].appointments?.length > 0 
    ? Object.keys(jobs[0].appointments[0]).sort() 
    : [];

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Appointment Data Structure</h1>
        <p className="text-muted-foreground">Raw data from ServiceTitan API</p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold mb-2">Total Jobs: {jobCount}</p>
            {jobs.map((job: any, idx: number) => (
              <div key={idx} className="text-sm text-muted-foreground ml-4">
                Job {idx + 1}: {job.jobNumber || job.id} | Status: {job.jobStatus} | Appointments: {job.appointments?.length || 0}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Job Object Fields</CardTitle>
          <CardDescription>Available properties on each job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
            {jobFields.join(', ')}
          </div>
        </CardContent>
      </Card>

      {/* Appointment Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Object Fields</CardTitle>
          <CardDescription>Available properties on each appointment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded font-mono text-sm overflow-x-auto">
            {appointmentFields.join(', ')}
          </div>
        </CardContent>
      </Card>

      {/* First Job Sample */}
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>First Job - Full Object</CardTitle>
            <CardDescription>Complete data for the first job</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
              <pre>{JSON.stringify(jobs[0], null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={copyToClipboard} variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          Copy to Clipboard
        </Button>
        <Button onClick={downloadJson} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download JSON
        </Button>
        <Button onClick={fetchAppointmentsData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Raw JSON */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Raw Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
