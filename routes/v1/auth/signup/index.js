const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { SECRET } = require("../../../../config");
const { insertNewDocument, findOne } = require("../../../../helpers");
const Joi = require("joi");
const { send_email } = require("../../../../lib");
const schema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  // password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{6,30}$")).required(),
  // password: Joi.string()
  //   .min(6)
  //   .max(30)
  //   .pattern(
  //     new RegExp(
  //       "^(?=.*[A-Za-z])(?=.*d)(?=.*[@$!%*#?&])[A-Za-zd@$!%*#?&]{6,30}$"
  //     )
  //   )
  //   .required(),
  password: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9@$!%*#?&]{6,30}$"))
    .required(),
  // type: Joi.string().required(),
  // status: Joi.string().required(),
});

const signUpUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const validate = await schema.validateAsync(req.body);

    const check_user_exist = await findOne("user", { email });
    if (check_user_exist) {
      return res
        .status(404)
        .send({ status: 404, message: "User already exist!" });
    }
    const check_user_type = await findOne("userType", { type: "User" });
    if (!check_user_type) {
      return res
        .status(404)
        .send({ status: 404, message: "No user type found" });
    }

    const new_user = {
      ...req.body,
      password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      type: check_user_type._id,
    };
    const user = await insertNewDocument("user", new_user);
    let token = jwt.sign({ id: user._id }, SECRET, {
      expiresIn: "24h",
    });
    user.password = undefined;
    // send_email(
    // 	"registration-email",
    // 	{
    // 		username: user.first_name,
    // 		location: "test"
    // 	},
    // 	"Health Titan Pro",
    // 	"Awaiting Admin Approval",
    // 	user.email
    // );
    return res.status(200).send({ status: 200, user, token });
  } catch (e) {
    return res.status(400).send({ status: 400, message: e.message });
  }
};

module.exports = signUpUser;
