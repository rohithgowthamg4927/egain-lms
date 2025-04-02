
import React from 'react';

const Settings = () => {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application settings.
        </p>
      </div>
      
      <div className="grid gap-6">
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
          <p className="text-muted-foreground mb-4">
            This feature is coming soon. You will be able to configure various aspects of the application here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
