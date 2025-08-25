interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "current" | "completed" | "error";
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className = "" }: ProgressIndicatorProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep || step.status === "current";
          const isCompleted = step.status === "completed";
          const isError = step.status === "error";
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-200
                  ${isCompleted ? "bg-green-500 border-green-500 text-white shadow-sm" : ""}
                  ${isCurrent ? "bg-blue-500 border-blue-500 text-white shadow-md scale-110" : ""}
                  ${isError ? "bg-red-500 border-red-500 text-white shadow-sm" : ""}
                  ${step.status === "pending" ? "bg-gray-100 border-gray-300 text-gray-600" : ""}
                `}>
                  {isCompleted ? "✓" : isError ? "✕" : index + 1}
                </div>
                <div className="mt-3 text-center">
                  <div className={`text-sm font-medium transition-colors duration-200 ${
                    isCurrent ? "text-blue-600" : 
                    isCompleted ? "text-green-600" : 
                    isError ? "text-red-600" : "text-gray-500"
                  }`}>
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-400 mt-1 max-w-24">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-20 h-0.5 mx-4 transition-all duration-300
                  ${isCompleted ? "bg-green-500" : "bg-gray-300"}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced enrollment progress steps
export const enrollmentSteps: ProgressStep[] = [
  {
    id: "upload",
    label: "Upload Emails",
    status: "pending",
    description: "File or manual input"
  },
  {
    id: "validate",
    label: "Validate",
    status: "pending",
    description: "Check & clean data"
  },
  {
    id: "preview",
    label: "Review",
    status: "pending",
    description: "Confirm details"
  },
  {
    id: "complete",
    label: "Enroll",
    status: "pending",
    description: "Create records"
  }
];

// Student onboarding steps
export const studentOnboardingSteps: ProgressStep[] = [
  {
    id: "invited",
    label: "Invited",
    status: "pending",
    description: "Email sent"
  },
  {
    id: "login",
    label: "First Login",
    status: "pending",
    description: "Temporary password"
  },
  {
    id: "profile",
    label: "Complete Profile",
    status: "pending",
    description: "Required information"
  },
  {
    id: "active",
    label: "Active",
    status: "pending",
    description: "Full access"
  }
];

// Default export
export default ProgressIndicator; 