import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/admin/filter-presets/[id]/track-usage
 * Track filter preset usage and update lastUsedAt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preset = await prisma.filter_presets.findUnique({
      where: { id: params.id },
    })

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Check authorization (public presets or owner)
    if (!preset.isPublic && preset.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const updatedPreset = await prisma.filter_presets.update({
      where: { id: params.id },
      data: {
        usageCount: {
          increment: 1,
        },
        lastUsedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      usageCount: updatedPreset.usageCount,
      lastUsedAt: updatedPreset.lastUsedAt,
    })
  } catch (error) {
    console.error('Failed to track preset usage:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}
