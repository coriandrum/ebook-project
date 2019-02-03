#!/bin/sh

cd $1
rm -rf ORIGIN
rm -rf JPG
rm -rf THUMB

mkdir ORIGIN
mkdir JPG
mkdir THUMB

#output=$2

#convert -verbose -density 72 -trim $1 -quality 100 -flatten -sharpen 0x1.0 %02d.jpg

for ((i=0; i<=49; i++));
	do
		n=`expr $i + 1`
		convert -verbose -density 300 -colorspace sRGB target.pdf[$i] -quality 100 -flatten ORIGIN\/`printf %08d $n`.jpg
	done

cd ORIGIN
for i in *
	do
		convert -density 150 "$i" -resize 1075x1518! "../JPG/$i"
        convert -density 72 "$i" -resize 143x202! "../THUMB/thumb_$i"
		echo "$i...done"
	done
#convert -verbose -density 25 -colorspace sRGB target.pdf -quality 100 THUMB\/thumb_%08d.jpg
