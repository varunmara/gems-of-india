import { db } from "@/drizzle/db"
import {
  category,
  entity,
  entityRelationship,
  entityStatus,
  entityToCategory,
  entityType,
  reviews,
  roleAssignment,
  upvote,
  user,
} from "@/drizzle/db/schema"

const ENTITY_CATEGORIES = [
  { id: "political-party", name: "Political Party" },
  { id: "government-agency", name: "Government Agency" },
  { id: "court", name: "Court" },
  { id: "municipality", name: "Municipality" },
  { id: "school", name: "School" },
  { id: "non-profit", name: "Non-Profit" },
  { id: "government-official", name: "Government Official" },
  { id: "politician", name: "Politician" },
  { id: "police-department", name: "Police Department" },
  { id: "fire-department", name: "Fire Department" },
  { id: "central-government", name: "Central Government" },
  { id: "state-government", name: "State Government" },
  { id: "local-government", name: "Local Government" },
  { id: "gram-panchayat", name: "Gram Panchayat" },
  { id: "municipal-corporation", name: "Municipal Corporation" },
  { id: "tourism", name: "Tourism" },
  { id: "technology", name: "Technology" },
  { id: "community", name: "Community" },
  { id: "healthcare", name: "Healthcare" },
  { id: "education", name: "Education" },
  { id: "infrastructure", name: "Infrastructure" },
  { id: "finance", name: "Finance" },
  { id: "transport", name: "Transport" },
  { id: "energy", name: "Energy" },
  { id: "environment", name: "Environment" },
  { id: "agriculture", name: "Agriculture" },
  { id: "industry", name: "Industry" },
]

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
  "Uttar Pradesh",
  "Gujarat",
  "Rajasthan",
  "Kerala",
  "West Bengal",
  "Delhi",
]

const CITIES = {
  "Andhra Pradesh": ["Hyderabad", "Visakhapatnam", "Vijayawada"],
  Karnataka: ["Bangalore", "Mysore", "Mangalore"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur"],
  Kerala: ["Thiruvananthapuram", "Kochi", "Kozhikode"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur"],
  Delhi: ["New Delhi", "South Delhi", "North Delhi"],
}

async function seedDatabase() {
  console.log("🌱 Starting database seed...")

  try {
    // 1. Seed Categories
    console.log("📦 Seeding categories...")
    const existingCategories = await db.query.category.findMany()
    if (existingCategories.length === 0) {
      await db.insert(category).values(ENTITY_CATEGORIES)
      console.log(`✅ Seeded ${ENTITY_CATEGORIES.length} categories`)
    } else {
      console.log("⏭️  Categories already exist, skipping...")
    }

    // 2. Seed Users
    console.log("👥 Seeding users...")
    const usersData = [
      {
        name: "Rajesh Kumar",
        email: "rajesh.kumar@example.com",
        emailVerified: true,
        image: "https://avatars.githubusercontent.com/u/1?v=4",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "admin",
      },
      {
        name: "Priya Sharma",
        email: "priya.sharma@example.com",
        emailVerified: true,
        image: "https://avatars.githubusercontent.com/u/2?v=4",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "moderator",
      },
      {
        name: "Amit Patel",
        email: "amit.patel@example.com",
        emailVerified: true,
        image: "https://avatars.githubusercontent.com/u/3?v=4",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "user",
      },
      {
        name: "Sneha Reddy",
        email: "sneha.reddy@example.com",
        emailVerified: true,
        image: "https://avatars.githubusercontent.com/u/4?v=4",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "user",
      },
      {
        name: "Vikram Singh",
        email: "vikram.singh@example.com",
        emailVerified: true,
        image: "https://avatars.githubusercontent.com/u/5?v=4",
        createdAt: new Date(),
        updatedAt: new Date(),
        role: "user",
      },
    ]

    const insertedUsers = await db.insert(user).values(usersData).returning()
    console.log(`✅ Seeded ${insertedUsers.length} users`)

    // 3. Seed Entities (People)
    console.log("🧑 Seeding people entities...")
    const peopleData = [
      {
        name: "Dr. Arvind Kejriwal",
        description:
          "Chief Minister of Delhi. Known for anti-corruption activism and public welfare initiatives.",
        keywords: ["politics", "governance", "anti-corruption", "delhi"],
        city: "New Delhi",
        state: "Delhi",
        entityType: entityType.PERSON,
        slug: "arvind-kejriwal",
        status: entityStatus.PUBLISHED,
        imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
        createdBy: insertedUsers[0].id,
        updatedBy: insertedUsers[0].id,
        featuredOnHomepage: true,
        dailyRanking: 1,
      },
      {
        name: "Dr. Sudha Murthy",
        description:
          "Chairperson of Infosys Foundation. Philanthropist and author working in education and healthcare.",
        keywords: ["philanthropy", "education", "healthcare", "social-work"],
        city: "Bangalore",
        state: "Karnataka",
        entityType: entityType.PERSON,
        slug: "sudha-murthy",
        status: entityStatus.PUBLISHED,
        imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400",
        createdBy: insertedUsers[0].id,
        updatedBy: insertedUsers[0].id,
        featuredOnHomepage: true,
        dailyRanking: 2,
      },
      {
        name: "Kiran Bedi",
        description:
          "First female IPS officer. Social activist and former Lieutenant Governor of Puducherry.",
        keywords: ["police", "governance", "women-empowerment", "social-reform"],
        city: "New Delhi",
        state: "Delhi",
        entityType: entityType.PERSON,
        slug: "kiran-bedi",
        status: entityStatus.PUBLISHED,
        imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400",
        createdBy: insertedUsers[1].id,
        updatedBy: insertedUsers[1].id,
        featuredOnHomepage: false,
        dailyRanking: 5,
      },
    ]

    const insertedPeople = await db.insert(entity).values(peopleData).returning()
    console.log(`✅ Seeded ${insertedPeople.length} people`)

    // 4. Seed Entities (Organizations & Departments)
    console.log("🏢 Seeding organization entities...")
    const organizationsData = [
      {
        name: "Municipal Corporation of Greater Mumbai",
        description:
          "The civic body that governs Mumbai. Responsible for infrastructure, sanitation, and public services.",
        keywords: ["municipality", "civic-services", "infrastructure", "mumbai"],
        streetAddress: "Mahapalika Marg",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400001",
        phoneNumber: "+91-22-2262-6464",
        email: "mcgm@mcgm.gov.in",
        websiteUrl: "https://portal.mcgm.gov.in",
        entityType: entityType.ORGANIZATION,
        slug: "mcgm-mumbai",
        status: entityStatus.PUBLISHED,
        logoUrl: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400",
        createdBy: insertedUsers[0].id,
        updatedBy: insertedUsers[0].id,
        featuredOnHomepage: true,
        dailyRanking: 3,
      },
      {
        name: "Bangalore Development Authority",
        description:
          "Government agency responsible for planning and development of Bangalore metropolitan area.",
        keywords: ["development", "urban-planning", "bangalore", "infrastructure"],
        streetAddress: "Dr Raj Kumar Road",
        city: "Bangalore",
        state: "Karnataka",
        zipCode: "560020",
        phoneNumber: "+91-80-2229-0425",
        email: "info@bdabangalore.org",
        websiteUrl: "https://bdabangalore.org",
        entityType: entityType.ORGANIZATION,
        slug: "bda-bangalore",
        status: entityStatus.PUBLISHED,
        logoUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400",
        createdBy: insertedUsers[1].id,
        updatedBy: insertedUsers[1].id,
        featuredOnHomepage: true,
        dailyRanking: 4,
      },
      {
        name: "Delhi Police",
        description:
          "The primary law enforcement agency for Delhi. Responsible for maintaining law and order in the capital.",
        keywords: ["police", "law-enforcement", "safety", "delhi"],
        streetAddress: "Jai Singh Road",
        city: "New Delhi",
        state: "Delhi",
        zipCode: "110001",
        phoneNumber: "100",
        email: "dcp-south@delhipolice.gov.in",
        websiteUrl: "https://delhipolice.gov.in",
        entityType: entityType.DEPARTMENT,
        slug: "delhi-police",
        status: entityStatus.PUBLISHED,
        logoUrl: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400",
        createdBy: insertedUsers[0].id,
        updatedBy: insertedUsers[0].id,
        featuredOnHomepage: false,
        dailyRanking: 6,
      },
      {
        name: "Indian Institute of Technology Bombay",
        description:
          "Premier engineering and technology institute. Known for world-class education and research.",
        keywords: ["education", "technology", "research", "engineering"],
        streetAddress: "Powai",
        city: "Mumbai",
        state: "Maharashtra",
        zipCode: "400076",
        phoneNumber: "+91-22-2576-4567",
        email: "info@iitb.ac.in",
        websiteUrl: "https://www.iitb.ac.in",
        entityType: entityType.ORGANIZATION,
        slug: "iit-bombay",
        status: entityStatus.PUBLISHED,
        logoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=400",
        createdBy: insertedUsers[1].id,
        updatedBy: insertedUsers[1].id,
        featuredOnHomepage: true,
        dailyRanking: 7,
      },
    ]

    const insertedOrgs = await db.insert(entity).values(organizationsData).returning()
    console.log(`✅ Seeded ${insertedOrgs.length} organizations`)

    // 5. Seed Infrastructure Entities
    console.log("🏗️ Seeding infrastructure entities...")
    const infrastructureData = [
      {
        name: "Rajiv Gandhi International Airport",
        description: "Major international airport serving Hyderabad and surrounding regions.",
        keywords: ["airport", "transport", "infrastructure", "hyderabad"],
        streetAddress: "Shamshabad",
        city: "Hyderabad",
        state: "Andhra Pradesh",
        zipCode: "500409",
        phoneNumber: "+91-40-6678-2000",
        email: "feedback@hyderabad.aero",
        websiteUrl: "https://www.hyderabad.aero",
        entityType: entityType.INFRASTRUCTURE,
        slug: "hyderabad-airport",
        status: entityStatus.PUBLISHED,
        imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400",
        createdBy: insertedUsers[0].id,
        updatedBy: insertedUsers[0].id,
        featuredOnHomepage: false,
        dailyRanking: 8,
      },
      {
        name: "Atal Setu (Mumbai Trans Harbour Link)",
        description: "India's longest sea bridge connecting Mumbai to Navi Mumbai.",
        keywords: ["bridge", "infrastructure", "transport", "mumbai"],
        city: "Mumbai",
        state: "Maharashtra",
        entityType: entityType.INFRASTRUCTURE,
        slug: "atal-setu-mumbai",
        status: entityStatus.PUBLISHED,
        imageUrl: "https://images.unsplash.com/photo-1545992820-8f6e2fa15ea8?w=400",
        createdBy: insertedUsers[1].id,
        updatedBy: insertedUsers[1].id,
        featuredOnHomepage: false,
        dailyRanking: 9,
      },
    ]

    const insertedInfra = await db.insert(entity).values(infrastructureData).returning()
    console.log(`✅ Seeded ${insertedInfra.length} infrastructure entities`)

    const allEntities = [...insertedPeople, ...insertedOrgs, ...insertedInfra]

    // 6. Link Entities to Categories
    console.log("🔗 Linking entities to categories...")
    const entityCategoryLinks = [
      { entityId: insertedPeople[0].id, categoryId: "politician" },
      { entityId: insertedPeople[0].id, categoryId: "government-official" },
      { entityId: insertedPeople[1].id, categoryId: "non-profit" },
      { entityId: insertedPeople[1].id, categoryId: "education" },
      { entityId: insertedPeople[2].id, categoryId: "government-official" },
      { entityId: insertedPeople[2].id, categoryId: "police-department" },
      { entityId: insertedOrgs[0].id, categoryId: "municipal-corporation" },
      { entityId: insertedOrgs[0].id, categoryId: "local-government" },
      { entityId: insertedOrgs[1].id, categoryId: "government-agency" },
      { entityId: insertedOrgs[1].id, categoryId: "infrastructure" },
      { entityId: insertedOrgs[2].id, categoryId: "police-department" },
      { entityId: insertedOrgs[2].id, categoryId: "state-government" },
      { entityId: insertedOrgs[3].id, categoryId: "school" },
      { entityId: insertedOrgs[3].id, categoryId: "education" },
      { entityId: insertedInfra[0].id, categoryId: "transport" },
      { entityId: insertedInfra[0].id, categoryId: "infrastructure" },
      { entityId: insertedInfra[1].id, categoryId: "transport" },
      { entityId: insertedInfra[1].id, categoryId: "infrastructure" },
    ]

    await db.insert(entityToCategory).values(entityCategoryLinks)
    console.log(`✅ Linked ${entityCategoryLinks.length} entity-category relationships`)

    // 7. Seed Role Assignments
    console.log("💼 Seeding role assignments...")
    const roleAssignments = [
      {
        personId: insertedPeople[0].id,
        orgId: insertedOrgs[2].id, // Delhi Police
        title: "Chief Advisor",
        responsibilities: "Policy oversight and governance advisory",
        startDate: new Date("2020-01-01"),
        createdBy: insertedUsers[0].id,
        updatedBy: insertedUsers[0].id,
      },
      {
        personId: insertedPeople[1].id,
        orgId: insertedOrgs[3].id, // IIT Bombay
        title: "Distinguished Visitor",
        responsibilities: "Guest lectures and mentorship programs",
        startDate: new Date("2015-01-01"),
        createdBy: insertedUsers[1].id,
        updatedBy: insertedUsers[1].id,
      },
    ]

    await db.insert(roleAssignment).values(roleAssignments)
    console.log(`✅ Seeded ${roleAssignments.length} role assignments`)

    // 8. Seed Reviews
    console.log("⭐ Seeding reviews...")
    const reviewsData = [
      {
        userId: insertedUsers[2].id,
        entityId: insertedOrgs[0].id, // MCGM
        rating: 3,
        title: "Decent service but slow response",
        content:
          "The municipal corporation has been improving over the years. However, complaint resolution still takes a lot of time. The online portal is helpful but needs better tracking.",
        helpful: 15,
        notHelpful: 3,
        verified: true,
        overallSatisfaction: 6,
        recommendToOthers: true,
        hasEvidence: false,
        isAnonymous: false,
        experienceDate: new Date("2024-08-15"),
        createdAt: new Date("2024-08-20"),
        updatedAt: new Date("2024-08-20"),
      },
      {
        userId: insertedUsers[3].id,
        entityId: insertedOrgs[0].id, // MCGM
        rating: 4,
        title: "Good infrastructure development",
        content:
          "I've noticed significant improvements in road quality and waste management in my area. The staff is generally helpful when you visit their office in person.",
        helpful: 22,
        notHelpful: 1,
        verified: true,
        overallSatisfaction: 8,
        recommendToOthers: true,
        hasEvidence: true,
        isAnonymous: false,
        experienceDate: new Date("2024-09-01"),
        createdAt: new Date("2024-09-05"),
        updatedAt: new Date("2024-09-05"),
      },
      {
        userId: insertedUsers[4].id,
        entityId: insertedOrgs[1].id, // BDA
        rating: 5,
        title: "Excellent transparency and planning",
        content:
          "BDA has been very transparent with their development plans. The public consultation process is commendable. Easy to get information about ongoing projects.",
        helpful: 31,
        notHelpful: 2,
        verified: true,
        overallSatisfaction: 9,
        recommendToOthers: true,
        hasEvidence: true,
        isAnonymous: false,
        experienceDate: new Date("2024-07-10"),
        createdAt: new Date("2024-07-15"),
        updatedAt: new Date("2024-07-15"),
      },
      {
        userId: insertedUsers[2].id,
        entityId: insertedOrgs[2].id, // Delhi Police
        rating: 4,
        title: "Quick response to emergency",
        content:
          "Had to call 100 for a road accident. Police arrived within 10 minutes and handled the situation professionally. Impressed by their efficiency.",
        helpful: 28,
        notHelpful: 0,
        verified: true,
        overallSatisfaction: 8,
        recommendToOthers: true,
        hasEvidence: false,
        isAnonymous: false,
        experienceDate: new Date("2024-06-20"),
        createdAt: new Date("2024-06-21"),
        updatedAt: new Date("2024-06-21"),
      },
      {
        userId: insertedUsers[3].id,
        entityId: insertedOrgs[3].id, // IIT Bombay
        rating: 5,
        title: "World-class institution",
        content:
          "As an alumnus, I can confidently say IIT Bombay provides exceptional education and research opportunities. The faculty is brilliant and infrastructure is top-notch.",
        helpful: 45,
        notHelpful: 1,
        verified: true,
        overallSatisfaction: 10,
        recommendToOthers: true,
        hasEvidence: true,
        isAnonymous: false,
        experienceDate: new Date("2023-01-01"),
        createdAt: new Date("2024-05-10"),
        updatedAt: new Date("2024-05-10"),
      },
      {
        userId: insertedUsers[4].id,
        entityId: insertedInfra[0].id, // Hyderabad Airport
        rating: 5,
        title: "Best airport experience in India",
        content:
          "Clean, modern, well-organized. Security checks are quick, and the staff is courteous. Plenty of dining and shopping options. Truly world-class!",
        helpful: 52,
        notHelpful: 2,
        verified: true,
        overallSatisfaction: 10,
        recommendToOthers: true,
        hasEvidence: false,
        isAnonymous: false,
        experienceDate: new Date("2024-10-01"),
        createdAt: new Date("2024-10-05"),
        updatedAt: new Date("2024-10-05"),
      },
      {
        userId: insertedUsers[2].id,
        entityId: insertedPeople[0].id, // Arvind Kejriwal
        rating: 4,
        title: "Good work on education and healthcare",
        content:
          "Significant improvements in government schools and mohalla clinics. Free electricity and water schemes have helped many families. Still room for improvement in pollution control.",
        helpful: 67,
        notHelpful: 23,
        verified: false,
        overallSatisfaction: 7,
        recommendToOthers: true,
        hasEvidence: false,
        isAnonymous: false,
        experienceDate: new Date("2024-01-01"),
        createdAt: new Date("2024-08-12"),
        updatedAt: new Date("2024-08-12"),
      },
      {
        userId: insertedUsers[3].id,
        entityId: insertedPeople[1].id, // Sudha Murthy
        rating: 5,
        title: "Inspiring philanthropist",
        content:
          "Her work through Infosys Foundation has touched countless lives. The focus on education, healthcare, and rural development is admirable. A true role model.",
        helpful: 89,
        notHelpful: 1,
        verified: false,
        overallSatisfaction: 10,
        recommendToOthers: true,
        hasEvidence: true,
        isAnonymous: false,
        experienceDate: new Date("2024-03-15"),
        createdAt: new Date("2024-03-20"),
        updatedAt: new Date("2024-03-20"),
      },
    ]

    const insertedReviews = await db.insert(reviews).values(reviewsData).returning()
    console.log(`✅ Seeded ${insertedReviews.length} reviews`)

    // 9. Seed Upvotes
    console.log("👍 Seeding upvotes...")
    const upvotesData = [
      { userId: insertedUsers[0].id, entityId: insertedOrgs[0].id },
      { userId: insertedUsers[1].id, entityId: insertedOrgs[0].id },
      { userId: insertedUsers[2].id, entityId: insertedOrgs[1].id },
      { userId: insertedUsers[3].id, entityId: insertedOrgs[1].id },
      { userId: insertedUsers[4].id, entityId: insertedOrgs[1].id },
      { userId: insertedUsers[0].id, entityId: insertedOrgs[2].id },
      { userId: insertedUsers[1].id, entityId: insertedOrgs[3].id },
      { userId: insertedUsers[2].id, entityId: insertedOrgs[3].id },
      { userId: insertedUsers[3].id, entityId: insertedOrgs[3].id },
      { userId: insertedUsers[4].id, entityId: insertedInfra[0].id },
      { userId: insertedUsers[0].id, entityId: insertedInfra[0].id },
      { userId: insertedUsers[1].id, entityId: insertedInfra[0].id },
      { userId: insertedUsers[2].id, entityId: insertedPeople[0].id },
      { userId: insertedUsers[3].id, entityId: insertedPeople[1].id },
      { userId: insertedUsers[4].id, entityId: insertedPeople[1].id },
    ]

    await db.insert(upvote).values(upvotesData)
    console.log(`✅ Seeded ${upvotesData.length} upvotes`)

    // 10. Seed Entity Relationships
    console.log("🔗 Seeding entity relationships...")
    const entityRelationships = [
      {
        parentEntityId: insertedOrgs[2].id, // Delhi Police
        childEntityId: insertedPeople[2].id, // Kiran Bedi
        relationshipType: "former_head_of",
        startDate: new Date("2003-05-01"),
        endDate: new Date("2007-05-31"),
        createdBy: insertedUsers[0].id,
        updatedBy: insertedUsers[0].id,
      },
    ]

    await db.insert(entityRelationship).values(entityRelationships)
    console.log(`✅ Seeded ${entityRelationships.length} entity relationships`)

    console.log("\n🎉 Database seeding completed successfully!")
    console.log("\n📊 Summary:")
    console.log(`   - ${ENTITY_CATEGORIES.length} categories`)
    console.log(`   - ${insertedUsers.length} users`)
    console.log(`   - ${allEntities.length} entities (people, orgs, infrastructure)`)
    console.log(`   - ${entityCategoryLinks.length} entity-category links`)
    console.log(`   - ${roleAssignments.length} role assignments`)
    console.log(`   - ${insertedReviews.length} reviews`)
    console.log(`   - ${upvotesData.length} upvotes`)
    console.log(`   - ${entityRelationships.length} entity relationships`)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log("✅ Seed script finished")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error)
    process.exit(1)
  })
