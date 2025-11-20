"use client"

import { useState } from 'react'

export default function Comments() {
    const [selectAll, setSelectAll] = useState(false)

    const model = {
        count: 23,
    }

    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-[200px] w-full max-w-[1034px] z-20 px-5">

            <div className="ml-0 md:ml-[185px]">

                <div className="flex flex-col gap-4 mb-6">

                    {/* Title */}
                    <div className="flex items-center">
                        <h1 className="font-bold text-base leading-6 text-gray-800 m-0 flex items-center gap-2">
                            <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
                            Comments({model.count})
                        </h1>
                    </div>

                    {/* Controls */}
                    <div className="flex">
                        <div className="flex items-center gap-2 mb-2">

                            <label className="flex items-center gap-2 bg-[#F8F8F8] py-2 px-3 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={() => setSelectAll(!selectAll)}
                                    className="cursor-pointer accent-violet-500"
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '4px',
                                        borderWidth: '1px',
                                        opacity: 1
                                    }}
                                />
                                <span className="font-bold text-sm text-gray-500">Select all</span>
                            </label>

                            <button
                                title="Delete"
                                className="w-8 h-8 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:border-gray-300"
                            >
                                <img src="/images/icons/trash1.svg" alt="delete" className="w-5 h-5" />
                            </button>

                        </div>
                    </div>
                </div>

<div className="border border-[#EDEDED] p-6 rounded-lg w-full max-w-[800px] md:p-6 p-4">

  <div className="flex items-start gap-3">
    <input type="checkbox" className="mt-1 accent-violet-500 cursor-pointer" />

    <div className="flex flex-col gap-4 -mt-1">

      {/* Top Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/images/comment/commentuser1.svg" alt="commentuser" className="w-6 h-6 rounded-full" />
          <p className="text-sm font-semibold text-[#14142D]">Sammy</p>
        </div>
        <p className="text-sm text-gray-400">2 days ago</p>
      </div>

      {/* Comment text */}
      <p className="text-sm text-[#696969] leading-relaxed">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ullam iste at repellendus dolore sequi libero omnis non placeat adipisci vitae reiciendis tenetur sint nam, laboriosam consequuntur similique ratione doloribus animi.
      </p>

      {/* Divider */}
      <hr className="border-t border-[#EDEDED]" />

      {/* Footer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">


        <p className="text-sm font-semibold text-[#202020]">
          Article: The title of the article
        </p>

        <button className="flex items-center gap-1 text-sm font-medium text-violet-500 hover:underline">
          See Full Conversation
          <img src="/images/comment/chevronright.svg" className="w-4 h-4" />
        </button>

      </div>
      
    </div>
  </div>

</div>

            </div>
        </div>
    )
}