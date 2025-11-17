"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function ToastExample() {
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold">Toast Examples</h2>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "Member already exists.",
            })
          }
          variant="destructive"
        >
          Member Exists
        </Button>

        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "Member does not exists.",
            })
          }
          variant="destructive"
        >
          Member Not Found
        </Button>

        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "Invitation is not valid.",
            })
          }
          variant="destructive"
        >
          Invalid Invitation
        </Button>

        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "Your invitation has expired.",
            })
          }
          variant="destructive"
        >
          Expired Invitation
        </Button>
        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "Single editor access only.",
            })
          }
          variant="destructive"
        >
          Single editor access
        </Button>
        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "Member already invited.",
            })
          }
          variant="destructive"
        >
          Member already invited.
        </Button>
        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "You can reinvite after a few minutes.",
            })
          }
          variant="destructive"
        >
          You can reinvite after a few minutes.
        </Button>
        <Button
          onClick={() =>
            toast({
              variant: "error",
              title: "Reached the maximum invite.",
            })
          }
          variant="destructive"
        >
          Reached the maximum invite.
        </Button>

      </div>
    </div>
  )
}