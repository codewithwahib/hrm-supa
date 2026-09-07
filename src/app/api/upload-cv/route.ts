// app/api/upload-cv/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Upload API called')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Supabase environment variables missing')
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase server configuration is missing'
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided'
        },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only PDF files are allowed'
        },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: 'File size must be less than 10MB'
        },
        { status: 400 }
      )
    }

    const fileName = `cv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.pdf`
    const filePath = `cvs/${fileName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    console.log('📤 Uploading to CVS bucket:', {
      bucket: 'CVS',
      path: filePath,
      size: file.size
    })

    // Upload to 'CVS' bucket
    const { data, error } = await supabase.storage
      .from('CVS')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Supabase Storage error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: 500 }
      )
    }

    console.log('✅ CV uploaded:', data)

    // ✅ Get the FULL public URL
    const { data: publicUrlData } = supabase.storage
      .from('CVS')
      .getPublicUrl(filePath)

    // ✅ Return the full URL
    const fullPublicUrl = publicUrlData.publicUrl
    console.log('🔗 Full Public URL:', fullPublicUrl)

    return NextResponse.json({
      success: true,
      message: 'CV uploaded successfully',
      url: fullPublicUrl,  // ✅ Return ONLY the full URL
      assetId: data.path,
      path: filePath
    })

  } catch (error) {
    console.error('❌ Upload API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      },
      { status: 500 }
    )
  }
}