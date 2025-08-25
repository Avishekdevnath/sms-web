import { NextRequest } from "next/server";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { emailService } from "@/lib/email";

export async function GET(req: NextRequest) {
  await getAuthUserFromRequest(req);
  requireRoles(await getAuthUserFromRequest(req), ["admin", "manager"]);
  
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  
  switch (action) {
    case "templates":
      const category = searchParams.get("category");
      const templates = await emailService.listTemplates(category || undefined);
      return Response.json({ data: templates });
      
    case "tracking":
      const trackingId = searchParams.get("trackingId");
      if (trackingId) {
        const tracking = await emailService.getEmailTracking(trackingId);
        return Response.json({ data: tracking });
      }
      return Response.json({ error: { code: "VALIDATION.ERROR", message: "trackingId required" } }, { status: 400 });
      
    case "preferences":
      const userId = searchParams.get("userId");
      if (userId) {
        const preferences = await emailService.getEmailPreferences(userId);
        return Response.json({ data: preferences });
      }
      return Response.json({ error: { code: "VALIDATION.ERROR", message: "userId required" } }, { status: 400 });
      
    case "bulk-operations":
      const operations = await emailService.listBulkOperations();
      return Response.json({ data: operations });
      
    case "bulk-operation":
      const operationId = searchParams.get("operationId");
      if (operationId) {
        const operation = await emailService.getBulkOperation(operationId);
        return Response.json({ data: operation });
      }
      return Response.json({ error: { code: "VALIDATION.ERROR", message: "operationId required" } }, { status: 400 });
      
    default:
      return Response.json({ error: { code: "VALIDATION.ERROR", message: "Invalid action" } }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  await getAuthUserFromRequest(req);
  requireRoles(await getAuthUserFromRequest(req), ["admin", "manager"]);
  
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();
  
  switch (action) {
    case "send-template":
      try {
        const { to, templateId, variables, options } = body;
        const trackingId = await emailService.sendTemplateEmail(to, templateId, variables, options);
        return Response.json({ data: { trackingId } });
      } catch (error) {
        return Response.json({ 
          error: { 
            code: "EMAIL_SEND_FAILED", 
            message: error instanceof Error ? error.message : "Failed to send email" 
          } 
        }, { status: 500 });
      }
      
    case "create-template":
      try {
        const template = await emailService.createTemplate(body);
        return Response.json({ data: template }, { status: 201 });
      } catch (error) {
        return Response.json({ 
          error: { 
            code: "TEMPLATE_CREATION_FAILED", 
            message: error instanceof Error ? error.message : "Failed to create template" 
          } 
        }, { status: 500 });
      }
      
    case "create-bulk-operation":
      try {
        const { name, templateId, recipients, variables, scheduledFor } = body;
        const operation = await emailService.createBulkEmailOperation(
          name, 
          templateId, 
          recipients, 
          variables, 
          scheduledFor ? new Date(scheduledFor) : undefined
        );
        return Response.json({ data: operation }, { status: 201 });
      } catch (error) {
        return Response.json({ 
          error: { 
            code: "BULK_OPERATION_CREATION_FAILED", 
            message: error instanceof Error ? error.message : "Failed to create bulk operation" 
          } 
        }, { status: 500 });
      }
      
    case "process-bulk-operation":
      try {
        const { operationId } = body;
        await emailService.processBulkEmail(operationId);
        return Response.json({ data: { success: true } });
      } catch (error) {
        return Response.json({ 
          error: { 
            code: "BULK_OPERATION_PROCESSING_FAILED", 
            message: error instanceof Error ? error.message : "Failed to process bulk operation" 
          } 
        }, { status: 500 });
      }
      
    case "resend-email":
      try {
        const { trackingId } = body;
        const newTrackingId = await emailService.resendEmail(trackingId);
        return Response.json({ data: { trackingId: newTrackingId } });
      } catch (error) {
        return Response.json({ 
          error: { 
            code: "EMAIL_RESEND_FAILED", 
            message: error instanceof Error ? error.message : "Failed to resend email" 
          } 
        }, { status: 500 });
      }
      
    default:
      return Response.json({ error: { code: "VALIDATION.ERROR", message: "Invalid action" } }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  await getAuthUserFromRequest(req);
  requireRoles(await getAuthUserFromRequest(req), ["admin", "manager"]);
  
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json();
  
  switch (action) {
    case "update-template":
      try {
        const { templateId, updates } = body;
        const template = await emailService.updateTemplate(templateId, updates);
        if (!template) {
          return Response.json({ error: { code: "NOT_FOUND", message: "Template not found" } }, { status: 404 });
        }
        return Response.json({ data: template });
      } catch (error) {
        return Response.json({ 
          error: { 
            code: "TEMPLATE_UPDATE_FAILED", 
            message: error instanceof Error ? error.message : "Failed to update template" 
          } 
        }, { status: 500 });
      }
      
    case "update-preferences":
      try {
        const { userId, preferences } = body;
        const updatedPreferences = await emailService.setEmailPreferences(userId, preferences);
        return Response.json({ data: updatedPreferences });
      } catch (error) {
        return Response.json({ 
          error: { 
            code: "PREFERENCES_UPDATE_FAILED", 
            message: error instanceof Error ? error.message : "Failed to update preferences" 
          } 
        }, { status: 500 });
      }
      
    default:
      return Response.json({ error: { code: "VALIDATION.ERROR", message: "Invalid action" } }, { status: 400 });
  }
} 