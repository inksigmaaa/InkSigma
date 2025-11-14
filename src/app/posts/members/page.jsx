import NavbarLoggedin from "../../components/navbar/NavbarLoggedin"
import MemberSidebar from "../../membersidebar/MemberSidebar"

export default function MembersPage() {
  const members = [
    { id: 1, name: "Special Batista", role: "Author", image: "/images/icons/profileuser.svg", canExit: true },
    { id: 2, name: "John Cena", role: "Editor", image: "/images/icons/profileuser.svg", canExit: false },
    { id: 3, name: "The Rock", role: "Editor", image: "/images/icons/profileuser.svg", canExit: false },
    { id: 4, name: "Randy Ortan", role: "Editor", image: "/images/icons/profileuser.svg", canExit: false },
  ]

  return (
    <>
      <NavbarLoggedin />
      <MemberSidebar />
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        top: '200px',
        width: '100%',
        maxWidth: '1034px',
        zIndex: 10,
        padding: '0 20px'
      }}>
        <div className="ml-0 md:ml-[230px]">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">Members</h1>

          <div className="space-y-3 md:space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 md:py-4 border-b border-gray-200 gap-3 sm:gap-0"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <span className="text-sm md:text-base font-semibold text-gray-900">{member.name}</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 pl-13 sm:pl-0">
                  <span className="text-gray-400 text-xs md:text-sm">{member.role}</span>

                  {member.canExit ? (
                    <button className="bg-red-50 text-red-500 px-4 md:px-6 py-1.5 md:py-2 rounded-md hover:bg-red-100 transition-colors text-xs md:text-sm font-medium whitespace-nowrap">
                      Exit
                    </button>
                  ) : (
                    <span className="text-gray-400 text-lg md:text-xl w-10 md:w-auto text-center">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
