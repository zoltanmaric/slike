package controllers

import play.api.mvc.{Action, Controller}

class EncryptionController extends Controller {
  def index = Action {
    Ok(views.html.encrypt())
  }
}
