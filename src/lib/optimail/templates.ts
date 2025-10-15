import { supabase } from '@/lib/supabase';
import { EmailTemplate, TemplateSaveResult } from '@/types/optimail';

// Using a generic table name 'mail_templates' (ensure migration exists)

const TABLE = 'mail_templates';

export async function fetchTemplates(userId: string): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(25);
  if (error) {
    console.warn('fetchTemplates error', error.message);
    return [];
  }
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    language: row.language || 'en',
    tone: row.tone || 'professional',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function saveTemplate(userId: string, title: string, content: string, meta?: { language?: string; tone?: string; }): Promise<TemplateSaveResult> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      title,
      content,
      language: meta?.language || 'en',
      tone: meta?.tone || 'professional',
    })
    .select()
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'Insert failed' };
  }
  const template: EmailTemplate = {
    id: data.id,
    title: data.title,
    content: data.content,
    language: data.language || 'en',
    tone: data.tone || 'professional',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
  return { success: true, template };
}

export async function updateTemplate(templateId: string, patch: Partial<Pick<EmailTemplate, 'title' | 'content' | 'tone' | 'language'>>): Promise<TemplateSaveResult> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch })
    .eq('id', templateId)
    .select()
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'Update failed' };
  }
  return {
    success: true,
    template: {
      id: data.id,
      title: data.title,
      content: data.content,
      language: data.language,
      tone: data.tone,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  };
}

const templatesApi = { fetchTemplates, saveTemplate, updateTemplate };
export default templatesApi;
