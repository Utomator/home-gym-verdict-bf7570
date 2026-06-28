import { bookDiscoveryCall } from './book-discovery-call'
import { getOrganizationInfo } from './get-organization-info'
import { searchBlogPosts } from './search-blog-posts'

export const ALL_TOOLS = [
  searchBlogPosts,
  getOrganizationInfo,
  bookDiscoveryCall,
] as const
