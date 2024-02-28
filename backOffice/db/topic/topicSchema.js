/**
 * 主题库， 唯一的ID
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// 主题的ID，title，开始时间，结束时间等，创作者的id，名称，
var topicSchema = new Schema({
  title: { type: String, default: "no name" },
  description: { type: String, default: "" },
  questionOpusId: Number,
  posterPicturePath: { type: String, default: "" },
  introId: Number,
  outroId: Number,
  statTime: { type: Date },
  endTime: { type: Date },
  lastModified: { type: Date, default: Date.now },
  authorId: Number,
  authorName: { type: String, default: "" }, // 作者姓名和单位，冗余，以避免1次查作者库
  authorSchool: { type: String, default: "" },
  isShared: { type: Boolean, default: false }, // 个人私有/与众共享
  isBanned: { type: Boolean, default: false }, // 禁止， 任何人都看不到， 包括自己
  requestToBan: { type: Boolean, default: false }, // 用户或粗审员请求禁止
  requestToShare: { type: Boolean, default: false }, // 用户或粗审员请求分享
  // 申请共享，批准发表
  state: { type: Number, default: 10 }, // 10, 私有的,
  _id: Number
}, { _id: false });

function setup(autoIncrement) {
  topicSchema.plugin(autoIncrement, { id: "topic_id", inc_field: "_id" });
  mongoose.model("Topic", topicSchema); // 定义名为'Topic'的model，根据topicSchema
}

exports.setup = setup;
exports.schems = topicSchema;
