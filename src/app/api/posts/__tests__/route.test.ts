import { GET as getPostsHandler } from '@/app/api/posts/route'
import Post from '@/models/postModel'

jest.mock('@/dbConnection/dbConnection')
jest.mock('@/models/postModel')

describe('/api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return all posts with formatted image data', async () => {
    const mockPosts = [
      {
        _id: '1',
        headline: 'Post 1',
        email: 'user1@example.com',
        content: 'Content 1',
        author: 'Author 1',
        designation: 'Developer',
        authorImage: {
          data: Buffer.from('image-data'),
          contentType: 'image/png',
        },
      },
      {
        _id: '2',
        headline: 'Post 2',
        email: 'user2@example.com',
        content: 'Content 2',
        author: 'Author 2',
        designation: 'Designer',
        authorImage: null,
      },
    ]

    ;(Post.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockPosts),
    })

    const response = await getPostsHandler()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.posts).toHaveLength(2)
  })

  it('should convert image buffer to base64 string', async () => {
    const imageBuffer = Buffer.from('test-image-data')
    const mockPost = {
      _id: '1',
      headline: 'Post 1',
      email: 'user@example.com',
      content: 'Content',
      author: 'Author',
      designation: 'Dev',
      authorImage: {
        data: imageBuffer,
        contentType: 'image/png',
      },
    }

    ;(Post.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([mockPost]),
    })

    const response = await getPostsHandler()
    const data = await response.json()

    expect(data.posts[0].authorImage).toContain('data:image/png;base64,')
    expect(data.posts[0].authorImage).toContain(imageBuffer.toString('base64'))
  })

  it('should handle posts without images', async () => {
    const mockPost = {
      _id: '1',
      headline: 'Post 1',
      email: 'user@example.com',
      content: 'Content',
      author: 'Author',
      designation: 'Dev',
      authorImage: null,
    }

    ;(Post.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([mockPost]),
    })

    const response = await getPostsHandler()
    const data = await response.json()

    expect(data.posts[0].authorImage).toBeNull()
  })

  it('should exclude __v field from response', async () => {
    const mockPost = {
      _id: '1',
      headline: 'Post 1',
      email: 'user@example.com',
      content: 'Content',
      author: 'Author',
      designation: 'Dev',
      authorImage: null,
      __v: 0,
    }

    ;(Post.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([mockPost]),
    })

    const response = await getPostsHandler()

    expect((Post.find as jest.Mock)().select).toHaveBeenCalledWith('-__v')
  })

  it('should return empty array when no posts exist', async () => {
    ;(Post.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    })

    const response = await getPostsHandler()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.posts).toEqual([])
  })

  it('should handle database errors', async () => {
    ;(Post.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('Database connection failed')),
    })

    const response = await getPostsHandler()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Database connection failed')
  })

  it('should format post response correctly', async () => {
    const mockPost = {
      _id: '1',
      headline: 'Test Post',
      email: 'test@example.com',
      content: 'Test content',
      author: 'Test Author',
      designation: 'Test Designation',
      authorImage: null,
    }

    ;(Post.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue([mockPost]),
    })

    const response = await getPostsHandler()
    const data = await response.json()

    const formattedPost = data.posts[0]
    expect(formattedPost).toEqual(
      expect.objectContaining({
        _id: '1',
        headline: 'Test Post',
        email: 'test@example.com',
        content: 'Test content',
        author: 'Test Author',
        designation: 'Test Designation',
        authorImage: null,
      })
    )
  })
})
