import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Standard CORS headers so Claude or local bridge tools can query it
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Tool discovery endpoint for MCP
    if (body.method === 'tools/list') {
      return NextResponse.json(
        {
          tools: [
            {
              name: 'create_incident',
              description: 'Publishes a new system outage or incident update to the public status dashboard.',
              inputSchema: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Brief headline of the issue' },
                  severity: { type: 'string', enum: ['minor', 'major', 'critical'], description: 'Impact level' },
                  status: { type: 'string', enum: ['investigating', 'identified', 'monitoring', 'resolved'], description: 'Current status' },
                  summary: { type: 'string', description: 'User-facing explanation of the incident' },
                  impacted_services: { type: 'array', items: { type: 'string' }, description: 'Services affected, e.g. ["API", "Checkout"]' }
                },
                required: ['title', 'severity', 'status', 'summary']
              }
            }
          ]
        },
        { headers: corsHeaders }
      );
    }

    // 2. Tool execution endpoint
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;

      if (name === 'create_incident') {
        const { data, error } = await supabase.from('incidents').insert([args]).select().single();

        if (error) {
          return NextResponse.json(
            { isError: true, content: [{ type: 'text', text: error.message }] },
            { headers: corsHeaders }
          );
        }

        return NextResponse.json(
          {
            content: [
              {
                type: 'text',
                text: `Incident published successfully. View live on dashboard. ID: ${data.id}`
              }
            ]
          },
          { headers: corsHeaders }
        );
      }
    }

    return NextResponse.json({ jsonrpc: '2.0', id: body.id ?? null, result: {} }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}