#!/bin/bash
#create by yuxuewen
#email 8586826@qq.com

symbol_cache(){
  curl $1/symbol_cache
}

poll_symbol_price(){
  for (( i = 0; i < 6; i++ )); do
      curl $1/poll_symbol_price
      sleep 10
  done
}

poll_symbol_price_pre_minute(){
  curl $1/poll_symbol_price
}

loadIpList(){
  curl $1/loadIpList
}

pollNotFinishedOrder(){
  curl $1/pollNotFinishedOrder
}




while [ -n $1 ]
do
    case $1 in
        "symbol_cache")
            symbol_cache $2;;
        "poll_symbol_price")
            poll_symbol_price $2;;
        "poll_symbol_price_pre_minute")
            poll_symbol_price_pre_minute $2;;
        "loadIpList")
            loadIpList $2;;
        "pollNotFinishedOrder")
            pollNotFinishedOrder $2;;
        *) break ;;
    esac

    shift

done