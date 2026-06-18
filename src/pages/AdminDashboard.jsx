import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { mockWorkers } from '../lib/mockData';
import { IconTrash, IconEdit, IconCheck, IconX } from '@tabler/icons-react';

export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage platform workers and users</p>
        </div>
      </div>

      <Card className="glass border-border/40 shadow-xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border/40">
          <CardTitle>Registered Workers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {mockWorkers.map(worker => (
                  <tr key={worker.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                      <img src={worker.avatar} alt={worker.name} className="h-8 w-8 rounded-full" />
                      {worker.name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-background">
                        {worker.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {worker.available ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <IconCheck className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <IconX className="h-4 w-4" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{worker.location}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
