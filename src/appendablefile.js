const fs = require('fs');

class AppendableFile {
  constructor(path) {
    this.fd = fs.openSync(path, 'a+')
    this.path=path
    this.lastposition=0
    this.dataposition=[]
    this.datalength=[]
    this.lastid=-1
  }
addItem(id,itemstring){
    fs.appendFileSync(this.fd, itemstring+';', 'utf8');
	this.dataposition[id]=this.lastposition
	this.datalength[id]=itemstring.length
  this.lastposition+=itemstring.length+1
  if (id>this.lastid){
    this.lastid=id
  }
    }
getLastItem(){
    return this.getItem(this.lastid)
    //return this.getItem(this.getLength()-1)
}
getLength(){
    return this.dataposition.length
}
terminate(){
/*    fs.unlink(this.path, (err) => {
        if (err) throw err;
        //console.log('file deleted');
      });*/
    fs.unlinkSync(this.path)
      
}
getItem(itemid){
  if (itemid<0)
    return

console.log('getItem',itemid,this.datalength[itemid])
var databuffer = new Buffer.alloc(this.datalength[itemid]);

	//fs.read(fd, buffer, offset, length, position, callback)

	if ( fs.readSync(this.fd,databuffer, 0, this.datalength[itemid],this.dataposition[itemid]))
{return databuffer.toString()}
}
}
module.exports = AppendableFile;