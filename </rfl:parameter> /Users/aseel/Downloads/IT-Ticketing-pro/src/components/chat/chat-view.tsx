</rfl:parameter>                     {activeConversation?.ticket
                      ? `مرتبطة بتذكرة #${activeConversation.ticket.id} - ${activeConversation.ticket.title}`
                      : `مشاركون: ${activeConversation?.participants
                          ?.filter((p) => p.userId !== currentUser.id)
                          .map((p) => p.user.fullName)
                          .join("، ")}`}</